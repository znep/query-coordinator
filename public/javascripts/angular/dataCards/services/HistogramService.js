(function() {
  'use strict';

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
    function bucketData(data, options) {

      // Returns an object mapping magnitudes to buckets. Also merges the
      // bucket with magnitude zero into the bucket with magnitude one.
      function getDataByMagnitude(data) {
        var dataByMagnitude = _.indexBy(data, 'magnitude');

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
      function getLinearBucket(magnitude, value) {
        var start = 0;
        var end = 0;

        if (magnitude > 0) {
          start = (magnitude - 1) * options.bucketSize;
          end = magnitude * options.bucketSize;
        } else if (magnitude < 0) {
          start = magnitude * options.bucketSize;
          end = (magnitude + 1) * options.bucketSize;
        }

        return {
          start: start,
          end: end,
          value: value
        };
      }

      // Input validation
      if (!_.isArray(data) || _.isEmpty(data)) {
        return [];
      }

      if (!_.isPresent(options)) {
        throw new Error('Missing options from HistogramService.bucketData');
      }

      if (options.bucketType === 'linear' && !_.isPresent(options.bucketSize)) {
        $log.error('bucketType of "linear" also needs a bucketSize');
        return null;
      }

      var dataByMagnitude = getDataByMagnitude(data);
      var range = getMagnitudeRange(dataByMagnitude);

      // Map over the range, converting magnitudes into start and end keys.
      return _.map(range, function(magnitude) {

        // Try to get the value for the original bucket, defaulting to zero.
        var value = _.get(dataByMagnitude, magnitude + '.value', 0);

        if (options.bucketType === 'logarithmic') {
          return getLogarithmicBucket(magnitude, value);
        } else {
          if (options.bucketType !== 'linear') {
            $log.warn('Unknown bucket type ' +
              '"{0}", defaulting to linear'.format(options.bucketType));
          }

          return getLinearBucket(magnitude, value);
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
      if (extent[1] - extent[0] > Constants.HISTOGRAM_COLUMN_CHART_RANGE_THRESHOLD) {
        return 'histogram';
      }

      function isInteger(x) {
        return parseInt(x, 10) === parseFloat(x);
      }

      return _.every(buckets, isInteger) ? 'columnChart' : 'histogram';
    }

    // Given an array of bucketed data and a bucket index that is being
    // filtered on, transform the bucketed data into the tabular format
    // expected by the column chart.
    function transformDataForColumnChart(data, selectedIndex) {
      if (!_.isObject(data) || !_.isDefined(data.unfiltered) || !_.isDefined(data.filtered)) {
        return data;
      }

      return data.unfiltered.map(function(bucket, i) {
        var filteredValue = data.filtered[i].value;

        if (_.isDefined(selectedIndex) && i !== selectedIndex) {
          filteredValue = 0;
        }

        return [
          bucket.start,
          bucket.value,
          filteredValue,
          i === selectedIndex
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
