var constants = require('./DistributionChartConstants');
var d3 = require('d3');
var _ = require('lodash');

var helpers = module.exports = {
  clamp: function(x, min, max) {
    if (!_.isNumber(x) || !_.isNumber(min) || !_.isNumber(max)) {
      throw new Error('DistributionChartHelpers.clamp inputs must be numbers');
    }

    return Math.max(Math.min(x, max), min);
  },

  translate: function(x, y) {
    if (!_.isNumber(x) || !_.isNumber(y)) {
      throw new Error('DistributionChartHelpers.translate inputs must be numbers');
    }

    return 'translate(' + x + ', ' + y + ')';
  },

  getMouseOffsetPosition: function(event, props) {
    return event.nativeEvent.offsetX - props.margin.left;
  },

  positionToBucketIndex: function(position, scale, discretizer) {
    var bucketWidth = scale.x.rangeBand();
    discretizer = discretizer || Math.floor;
    return helpers.clamp(discretizer(position / bucketWidth), 0, scale.x.domain().length - 1);
  },

  positionToBucket: function(position, scale, discretizer) {
    return scale.x.domain()[helpers.positionToBucketIndex(position, scale, discretizer)];
  },

  bucketToPosition: function(scale) {
    return function(d) {
      if (d === 'start') {
        return scale.x.rangeExtent()[0];
      } else if (d === 'end') {
        return scale.x.rangeExtent()[1];
      } else {
        return scale.x(d.end);
      }
    };
  },

  yCoordinateForBucket: function(scale, data) {
    var origin = scale.y(0);
    return function(d) {
      if (d === 'start') {
        return scale.y(_.head(data).value);
      } else if (d === 'end') {
        return scale.y(_.last(data).value);
      } else {
        var scaledValue = scale.y(d.value);

        // Values close to but not equal zero be at least 2 pixels away from the axis line for
        // readability.
        if (d.value !== 0 && Math.round(scaledValue) === Math.round(origin)) {
          if (d.value > 0) {
            return origin - 2;
          } else {
            return origin + 2;
          }
        } else {
          return scaledValue;
        }
      }
    };
  },

  getTickColor: function(value) {
    return (value === 0) ? constants.colors.tick.bold : constants.colors.tick.light;
  },

  getXTickAlign: function(bucket, scale) {
    if (bucket === _.head(scale.x.domain())) { return 'start'; }
    if (bucket === _.last(scale.x.domain())) { return 'end'; }
    return 'middle';
  },

  getYTickOffset: function(position) {
    if (position - constants.tickLength <= 14) {
      return position + 14;
    }

    return position - constants.tickLength;
  },

  getXLabelColor: function(bucket, filter) {
    if (_.isObject(filter)) {
      return constants.colors.tick.dimmed;
    }

    return helpers.getTickColor(bucket);
  },

  generateSVGRenderer: function(type) {
    return d3.svg[type]().
      interpolate('monotone').
      defined(function(d) {
        return _.isString(d) || (_.isObject(d) && _.isFinite(d.value));
      });
  },

  getBucketingOptions: function(domain, bucketTypeOverride) {
    if (!_.isObject(domain) ||
        !_.isFinite(domain.min) ||
        !_.isFinite(domain.max)) {
      throw new Error('Bad domain to getBucketingOptions ' + JSON.stringify(domain));
    }

    var absMax = Math.max(Math.abs(domain.min), Math.abs(domain.max));
    var threshold = 2000;

    var result = {};

    // If we have a defined bucket type, use that.  Otherwise, determine the
    // bucket type based upon the data.
    if (_.isString(bucketTypeOverride)) {
      result.bucketType = bucketTypeOverride;
    } else {
      result.bucketType = (absMax >= threshold) ? 'logarithmic' : 'linear';
    }

    if (result.bucketType === 'linear') {
      var buckets = d3.scale.linear().
        nice().
        domain([domain.min, domain.max]).
        ticks(20);

      if (buckets.length >= 2) {
        // We are vulnerable to floating point errors here so rounding off
        result.bucketSize = Math.round((buckets[1] - buckets[0]) * 1000000) / 1000000;
      } else {
        result.bucketSize = 1;
      }
    }

    return result;
  },

  /**
   * Given an array of buckets, normalizes the data to an array of bucket
   * objects containing start, end, and value keys representing the
   * inclusive minimum, exclusive maximum, and value of the bucket.  There
   * are two different possible paths based on whether or not we are using
   * a logarithmic scale or a linear scale.
   *
   * returns [{start:, end:, value:}];
   */
  bucketData: function(input, options) {

    // Input validation
    if (!_.isArray(input) || _.isEmpty(input)) {
      return [];
    }

    if (!_.isObject(options)) {
      throw new Error('Missing options from bucketData');
    }

    if (options.bucketType === 'linear' && !_.isNumber(options.bucketSize)) {
      return null;
    }

    var dataByMagnitude = helpers.getDataByMagnitude(input, options);
    var range = helpers.getMagnitudeRange(dataByMagnitude, options);

    // Map over the range, converting magnitudes into start and end keys.
    return _.map(range, function(magnitude) {

      // Try to get the value for the original bucket, defaulting to zero.
      var value = _.get(dataByMagnitude, magnitude + '.value', 0);

      // This is (hopefully temporarily) in place to remedy an issue where
      // sum aggregation on a histogram causes many issues if there are
      // no values to sum by for a particular bucket. Rather than deal with
      // the ensuing NaNs in the visualization, we set them to zero here.
      if (!_.isFinite(value)) {
        value = 0;
      }

      if (options.bucketType === 'logarithmic') {
        return helpers.getLogarithmicBucket(magnitude, value);
      } else {
        if (options.bucketType !== 'linear') {
          console.warn(
            `Unknown bucket type "${options.bucketType}", defaulting to linear`
          );
        }

        return helpers.getLinearBucket(magnitude, value, options.bucketSize);
      }
    });
  },

  // Returns an object mapping magnitudes to buckets. Also merges the
  // bucket with magnitude zero into the bucket with magnitude one for logarithmic bucketing
  getDataByMagnitude: function(data, options) {
    var dataByMagnitude = _.keyBy(_.cloneDeep(data), 'magnitude');
    var bucketType = _.get(options, 'bucketType');

    // Merge zero-bucket into one-bucket, if logarithmic
    if (bucketType === 'logarithmic') {
      if (_.isPlainObject(dataByMagnitude[0])) {
        if (_.isPlainObject(dataByMagnitude[1])) {
          dataByMagnitude[1].value += dataByMagnitude[0].value;
        } else {
          dataByMagnitude[1] = { magnitude: 1, value: dataByMagnitude[0].value };
        }
      }
    }

    return dataByMagnitude;
  },

  // Returns a range of magnitudes to iterate over. The range must be
  // continuous because of the use of an ordinal scale. The zero bucket
  // must be eliminated due to the current way zero buckets are treated.
  getMagnitudeRange: function(dataByMagnitude, options) {
    var bucketType = _.get(options, 'bucketType');
    var forceIncludeZero = _.get(options, 'forceIncludeZero', false);
    var extent = d3.extent(_.map(dataByMagnitude, 'magnitude'));
    var min = extent[0];
    var max = extent[1];
    var range;

    if (forceIncludeZero) {
      if (min > 0 && max > 0) {
        min = 0;
      } else if (min < 0 && max < 0) {
        max = 0;
      }
    }

    // +1 is there because _.range is a [min, max) range
    range = _.range(min, max + 1);

    // If we artificially extended the range so that it ends with '0', we need to remove '0' after the range is created
    // since 'getLinearBucket' will take each range value as a 'start', and set the 'end' to one magnitude above that
    // we would end up with '0 + bucketSize' as the last tick, as opposed to '0' if we didn't omit here
    if (forceIncludeZero && _.last(range) === 0) {
      range.pop();
    }

    // Only pull 0's out for Logarithmic buckets
    return bucketType === 'linear' ? range : _.pull(range, 0);
  },

  // Converts magnitude to start and end
  getLogarithmicBucket: function(magnitude, value) {
    var start = 0;
    var end = 0;

    if (magnitude > 0) {
      start = Math.pow(10, magnitude - 1);
      end = Math.pow(10, magnitude);

      // TODO we shouldn't be doing this - it groups
      // an infinite number of orders of magnitude into
      // one bucket.
      if (start === 1) {
        start = 0;
      }
    } else if (magnitude < 0) {
      start = -Math.pow(10, Math.abs(magnitude));
      end = -Math.pow(10, Math.abs(magnitude + 1));

      // TODO we shouldn't be doing this - it groups
      // an infinite number of orders of magnitude into
      // one bucket.
      if (end === -1) {
        end = 0;
      }
    }

    return {
      start: start,
      end: end,
      value: value
    };
  },

  // Converts magnitude to start and end
  getLinearBucket: function(magnitude, value, bucketSize) {
    // Also vulnerable to floating point weirdness here; applying same fix as above for now
    // until we can settle on a formal way to deal with floating point math
    var start = Math.round((magnitude * bucketSize) * 1000000) / 1000000;
    var end = Math.round(((magnitude + 1) * bucketSize) * 1000000) / 1000000;

    return {
      start: start,
      end: end,
      value: value
    };
  },

  // Returns an x and a y scale based on the current data.  The x scale maps buckets labels to pixel
  // values along the horizontal axis, and the y scale maps the values in the bucket to pixel values
  // along the y axis.
  getScaleForData: function(data) {
    if (!_.isObject(data)) {
      return;
    }

    var scale = {
      x: d3.scale.ordinal(),
      y: d3.scale.linear()
    };

    // First determine the list of buckets and set the x scale's domain.
    var buckets = _.map(data.unfiltered, 'start');

    if (!_.isEmpty(buckets)) {
      buckets.push(_.last(data.unfiltered).end);
    }

    scale.x.domain(buckets);

    // Then determine the extent of the data, extend it to zero if necessary and set the y domain.
    var dataRangeUnfiltered = d3.extent(data.unfiltered, _.property('value'));
    var dataRangeFiltered = d3.extent(data.filtered, _.property('value'));
    var extentY = d3.extent(dataRangeUnfiltered.concat(dataRangeFiltered));

    if (extentY[0] > 0) {
      extentY[0] = 0;
    } else if (extentY[0] < 0 && extentY[1] < 0) {
      extentY[1] = 0;
    }

    scale.y.domain(extentY);

    return scale;
  }
};
