(function() {
  'use strict';

    function TimelineChartVisualizationHelpers(DateHelpers) {

    /**
     * Precompute a bunch of things that are useful for rendering the timeline chart.
     *
     * @return {Object} with keys:
     *   @property {Date} minDate - the earliest date in the dataset,
     *   @property {Date} maxDate - the latest date in the dataset,
     *   @property {Number[]} offsets - An array of numbers, where the number at a given index
     *     corresponds to an object at that index in the 'values' array, and is a fraction that
     *     represents how far along the axis (percentage-wise) that value should be positioned,
     *     assuming a linear scale.
     *   @property {Number} minValue - the smallest value in the dataset,
     *   @property {Number} meanValue - the mean value in the dataset,
     *   @property {Number} maxValue - the largest value in the dataset,
     *   @property {Object[]} values - an array of objects with keys:
     *     @property {Date} date - the date at which this value occurs.
     *     @property {} filtered - the filtered value
     *     @property {} unfiltered - the unfiltered value
     *   @property {String} labelUnit - one of [day, month, year, decade]. TODO: is this used
     *     anywhere?,
     *   @property {Date[]} breaks - each date represents a new time period, depending on the time
     *     granularity. For example, if labelUnit is day, each date is the next day. If labelUnit is
     *     month, each date is the next month. The first element of this array is the minDate. TODO:
     *     this also doesn't seem to be used anywhere.
     */
    function transformChartDataForRendering(chartData, aggregation, datasetPrecision) {

      var minDate = null;
      var maxDate = null;
      var minValue = Number.POSITIVE_INFINITY;
      var maxValue = Number.NEGATIVE_INFINITY;
      var meanValue;
      var offsets;
      var duration;
      var labelUnit;
      var breakCount;
      var breakSize;
      var i;
      var breaks;

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

      // Note that we are intentionally wrapping minDate in
      // a new moment object in the tests below because
      // the .add() method is destructive... the actual
      // value of a non-wrapped minDate object after these
      // tests are made is more 22 years, 2 months after
      // the actual intended minDate.
      if (moment(minDate).add('months', 2).isAfter(maxDate)) {
        labelUnit = 'day';
        breakCount = Math.round(duration.asDays());
      } else if (moment(minDate).add('years', 2).isAfter(maxDate)) {
        labelUnit = 'month';
        breakCount = Math.round(duration.asMonths());
      } else if (moment(minDate).add('years', 20).isAfter(maxDate)) {
        labelUnit = 'year';
        breakCount = Math.round(duration.asYears());
      } else {
        labelUnit = 'decade';
        breakCount = Math.round(duration.asYears() / 10);
      }

      breakSize = duration.asMilliseconds() / breakCount;

      breaks = [minDate.toDate()];

      for (i = 1; i <= breakCount; i++) {
        // TODO: if, for example, breakSize is a day, but the minDate is not on a day boundary (eg
        // it's in the afternoon or something), then all the breaks will be in the afternoon, rather
        // than on the day boundary. This seems wrong.
        breaks.push(moment(minDate).add((i * breakSize), 'milliseconds').toDate());
      }

      // Map each datum to the range [0 .. 1] so we can easily
      // determine which data to highlight when the mouse moves
      // across the chart.
      //_.each(allValues, function(value) {
      //  value.offset = moment.duration(value.date - minDate).asMilliseconds() /
      //                 duration.asMilliseconds();
      //});

      offsets = allValues.map(function(value) {
        return moment(value.date).diff(minDate) / duration.asMilliseconds();
      });

      return {
        aggregation: aggregation,
        minDate: minDate.toDate(),
        maxDate: maxDate.toDate(),
        offsets: offsets,
        minValue: minValue,
        meanValue: meanValue,
        maxValue: maxValue,
        values: allValues,
        labelUnit: labelUnit,
        breaks: breaks
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
