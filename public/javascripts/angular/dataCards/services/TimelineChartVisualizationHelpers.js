(function() {
  'use strict';

    function TimelineChartVisualizationHelpers(DateHelpers) {

    /**
     * Precompute a bunch of things that are useful for rendering the timeline chart.
     *
     * @return {Object} with keys:
     *   @property {Date} minDate - the earliest date in the dataset,
     *   @property {Date} maxDate - the latest date in the dataset,
     *   @property {Number} minValue - the smallest value in the dataset,
     *   @property {Number} meanValue - the mean value in the dataset,
     *   @property {Number} maxValue - the largest value in the dataset,
     *   @property {Object[]} values - an array of objects with keys:
     *     @property {Date} date - the date at which this value occurs.
     *     @property {} filtered - the filtered value
     *     @property {} unfiltered - the unfiltered value
     */
    function transformChartDataForRendering(chartData, aggregation, datasetPrecision) {

      var minDate = null;
      var maxDate = null;
      var minValue = Number.POSITIVE_INFINITY;
      var maxValue = Number.NEGATIVE_INFINITY;
      var meanValue;
      var duration;
      var allValues = chartData.map(function(datum) {

        if (minDate === null) {
          minDate = datum.date;
        } else if (datum.date < minDate) {
          minDate = datum.date;
        }

        if (maxDate === null) {
          maxDate = datum.date;
        } else if (datum.date > maxDate) {
          maxDate = datum.date;
        }

        if (datum.total < minValue) {
          minValue = datum.total;
        }

        if (datum.total > maxValue) {
          maxValue = datum.total;
        }

        return {
          date: datum.date.toDate(),
          filtered: datum.filtered,
          unfiltered: datum.total
        }
      });

      minValue = (minValue > 0) ? 0 : minValue;
      maxValue = (maxValue < 0) ? 0 : maxValue;
      meanValue = (maxValue + minValue) / 2;

      // We receive individual rows from the back-end
      // but we want to display intelligent aggregates
      // on the chart. We do this by bucketing each
      // datum; in order to accomplish that we must first
      // derive the number of buckets and the  temporal
      // span of each one.
      duration = moment.duration(maxDate - minDate);

      if (duration <= 0) {
        throw new Error(
          'Cannot transform timeline chart data for rendering: ' +
          'the time interval of the data is less than or equal to zero.'
        );
      }

      return {
        aggregation: aggregation,
        minDate: minDate.toDate(),
        maxDate: maxDate.toDate(),
        minValue: minValue,
        meanValue: meanValue,
        maxValue: maxValue,
        values: allValues
      }
    }

    return {
      transformChartDataForRendering: transformChartDataForRendering
    };

  }

  angular.
    module('dataCards.services').
      factory('TimelineChartVisualizationHelpers', TimelineChartVisualizationHelpers);

})();
