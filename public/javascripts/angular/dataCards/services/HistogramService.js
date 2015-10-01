(function() {
  'use strict';

  // Returns an object mapping magnitudes to buckets. Also merges the
  // bucket with magnitude zero into the bucket with magnitude one.
  function getDataByMagnitude(data) {
    var dataByMagnitude = _.indexBy(_.cloneDeep(data), 'magnitude');

    // Merge zero-bucket into one-bucket.
    if (_.isPresent(dataByMagnitude[0])) {
      if (_.isPresent(dataByMagnitude[1])) {
        dataByMagnitude[1].value += dataByMagnitude[0].value;
      } else {
        dataByMagnitude[1] = {magnitude: 1, value: dataByMagnitude[0].value};
      }
    }

    return dataByMagnitude;
  }

  // Returns a range of magnitudes to iterate over. The range must be
  // continuous because of the use of an ordinal scale. The zero bucket
  // must be eliminated due to the current way zero buckets are treated.
  function getMagnitudeRange(dataByMagnitude) {
    var extent = d3.extent(_.pluck(dataByMagnitude, 'magnitude'));
    var min = extent[0];
    var max = extent[1];

    if (min > 0 && max > 0) {
      min = 0;
    } else if (min < 0 && max < 0) {
      max = 0;
    }

    // +1 is there because _.range is a [min, max) range
    return _.pull(_.range(min, max + 1), 0);
  }

  // Converts magnitude to start and end
  function getLogarithmicBucket(magnitude, value) {
    var start = 0;
    var end = 0;

    if (magnitude > 0) {
      start = Math.pow(10, magnitude - 1);
      end = Math.pow(10, magnitude);

      if (start === 1) {
        start = 0;
      }
    } else if (magnitude < 0) {
      start = -Math.pow(10, Math.abs(magnitude));
      end = -Math.pow(10, Math.abs(magnitude + 1));

      if (end === -1) {
        end = 0;
      }
    }

    return {
      start: start,
      end: end,
      value: value
    };
  }

  // Converts magnitude to start and end
  function getLinearBucket(magnitude, value, bucketSize) {
    var start = 0;
    var end = 0;

    if (magnitude > 0) {
      start = (magnitude - 1) * bucketSize;
      end = magnitude * bucketSize;
    } else if (magnitude < 0) {
      start = magnitude * bucketSize;
      end = (magnitude + 1) * bucketSize;
    }

    return {
      start: start,
      end: end,
      value: value
    };
  }

  function HistogramService(Constants, $log) {

    /**
     * Input: {min:, max:}
     * Determines bucketing strategy for histogram card. Adds a bucketType
     * key to the input object that is either 'linear' or 'logarithmic'.
     * If the bucketType is 'linear', adds a bucketSize key to the input
     * object, which is the size of each bucket as calculated by d3.
     *
     * returns {min:, max:, bucketType:[, bucketSize:]}, mutates input
     */
    function getBucketingOptions(input, bucketType) {
      if (!_.isObject(input) ||
          !_.isFinite(input.min) ||
          !_.isFinite(input.max)) {
        throw new Error('Bad input to HistogramService.getBucketingOptions {0}'.format(JSON.stringify(input)));
      }

      var absMax = Math.max(Math.abs(input.min), Math.abs(input.max));
      var threshold = Constants.HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD;

      // If we have a defined bucket type, use that.  Otherwise, determine the
      // bucket type based upon the data.
      if (_.isDefined(bucketType)) {
        input.bucketType = bucketType;
      } else {
        input.bucketType = (absMax >= threshold) ? 'logarithmic' : 'linear';
      }

      if (input.bucketType === 'linear') {

        var buckets = d3.scale.linear().
          nice().
          domain([input.min, input.max]).
          ticks(20);

        if (buckets.length >= 2) {
          input.bucketSize = buckets[1] - buckets[0];
        } else {
          input.bucketSize = 1;
        }
      }

      return input;
    }

    /**
     * Given an array of buckets, normalizes the data to an array of bucket
     * objects containing start, end, and value keys representing the
     * inclusive minimum, exclusive maximum, and value of the bucket.  There
     * are two different possible paths based on whether or not we are using
     * a logarithmic scale or a linear scale.
     *
     * returns [{start:, end:, value:}];
     */
    function bucketData(input, options) {

      // Input validation
      if (!_.isArray(input) || _.isEmpty(input)) {
        return [];
      }

      if (!_.isPresent(options)) {
        throw new Error('Missing options from HistogramService.bucketData');
      }

      if (options.bucketType === 'linear' && !_.isPresent(options.bucketSize)) {
        $log.error('bucketType of "linear" also needs a bucketSize');
        return null;
      }

      var dataByMagnitude = getDataByMagnitude(input);
      var range = getMagnitudeRange(dataByMagnitude);

      // Map over the range, converting magnitudes into start and end keys.
      return _.map(range, function(magnitude) {

        // Try to get the value for the original bucket, defaulting to zero.
        var value = _.get(dataByMagnitude, magnitude + '.value', 0);

        // This is (hopefully temporarily) in place to remedy an issue where
        // sum aggregation on a histogram causes many issues if there are
        // no values to sum by for a particular bucket. Rather than deal with
        // the ensuing NaNs in HistogramVisualizationService, we set them to
        // zero here.
        if (!_.isFinite(value)) {
          value = 0;
        }

        if (options.bucketType === 'logarithmic') {
          return getLogarithmicBucket(magnitude, value);
        } else {
          if (options.bucketType !== 'linear') {
            $log.warn('Unknown bucket type ' +
              '"{0}", defaulting to linear'.format(options.bucketType));
          }

          return getLinearBucket(magnitude, value, options.bucketSize);
        }
      });
    }

    // Given an array of unique column values, return the type of visualization
    // that is best suited to display the distribution.
    function getVisualizationTypeForData(buckets) {
      if (!_.isArray(buckets) || _.isEmpty(buckets)) {
        return 'histogram';
      }

      if (buckets.length > Constants.HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD) {
        return 'histogram';
      }

      var extent = d3.extent(buckets);

      // This is... not super great, but honestly we shouldn't even be hitting
      // this case in the first place. If by some unfortunate turn of events we
      // reach this section and all bucket values were not valid numbers (i.e.
      // NaN), then bail out and try for a histogram anyway, in the hope that we
      // can either render something sane (which is a bit of a long shot) or get
      // the "no data" error.
      // See CORE-6648 for the browser-crashing fun times that surfaced the issue.
      if (_.all(extent, _.isUndefined)) {
        return 'histogram';
      }

      if (extent[1] - extent[0] > Constants.HISTOGRAM_COLUMN_CHART_RANGE_THRESHOLD) {
        return 'histogram';
      }

      function isInteger(x) {
        return parseInt(x, 10) === parseFloat(x);
      }

      return _.every(buckets, isInteger) ? 'column' : 'histogram';
    }

    // Given an array of bucketed data and a bucket index that is being
    // filtered on, transform the bucketed data into the tabular format
    // expected by the column chart.
    function transformDataForColumnChart(unfiltered, filtered, selectedValue) {
      if (filtered) {
        filtered = _.indexBy(filtered, 'name');
      }

      // Fill in gaps of the unfiltered data with zero-value buckets.
      for (var i = 1; i < unfiltered.length; i++) {
        if (unfiltered[i].name - unfiltered[i - 1].name > 1) {
          unfiltered.splice(i, 0, { name: Number(unfiltered[i - 1].name) + 1, value: 0});
        }
      }

      return unfiltered.map(function(bucket) {
        var bucketName = parseInt(bucket.name, 10);

        var filteredValue = _.get(filtered, bucketName + '.value', 0);

        if (_.isDefined(selectedValue) && bucketName !== selectedValue) {
          filteredValue = 0;
        }

        return [
          bucketName,
          bucket.value,
          filteredValue,
          bucketName === selectedValue
        ];
      });
    }

    return {
      getBucketingOptions: getBucketingOptions,
      bucketData: bucketData,
      getVisualizationTypeForData: getVisualizationTypeForData,
      transformDataForColumnChart: transformDataForColumnChart
    };
  }

  angular.
    module('dataCards.services').
      factory('HistogramService', HistogramService);

})();
