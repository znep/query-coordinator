(function() {
  'use strict';

  function DateHelpers() {

    function serializeFloatingTimestamp(date) {
      function formatToTwoPlaces(value) {
        return (value < 10) ?
          '0' + value.toString() :
          value.toString();
      }

      // The month component of JavaScript dates is 0-indexed
      // (I have no idea why) so when we are serializing a
      // JavaScript date as ISO-8601 date we need to increment
      // the month value.
      return '{0}-{1}-{2}T{3}:{4}:{5}'.format(
        date.getFullYear(),
        formatToTwoPlaces(date.getMonth() + 1),
        formatToTwoPlaces(date.getDate()),
        formatToTwoPlaces(date.getHours()),
        formatToTwoPlaces(date.getMinutes()),
        formatToTwoPlaces(date.getSeconds())
      );
    }

    function deserializeFloatingTimestamp(timestamp) {
      if (timestamp.length < 19 || isNaN(new Date(timestamp).getTime())) {
        throw new Error(
          'Could not parse floating timestamp: "{0}" is not a valid ISO-8601 date.'.
            format(timestamp)
        );
      }

      // The month component of JavaScript dates is 0-indexed
      // (I have no idea why) so when we are deserializing a
      // properly-formatted ISO-8601 date we need to decrement
      // the month value.
      return new Date(
        timestamp.substring(0, 4),
        timestamp.substring(5, 7) - 1,
        timestamp.substring(8, 10),
        timestamp.substring(11, 13),
        timestamp.substring(14, 16),
        timestamp.substring(17, 19)
      );
    }

    function decrementDateByHalfInterval(date, interval) {

      var newDate;

      switch (interval.toUpperCase()) {
        case 'DECADE':
          newDate = moment(date).subtract(5, 'year').toDate();
          break;
        case 'YEAR':
          newDate = moment(date).subtract(6, 'month').toDate();
          break;
        case 'MONTH':
          newDate = moment(date).subtract(15, 'day').toDate();
          break;
        case 'DAY':
          newDate = moment(date).subtract(12, 'hour').toDate();
          break;
        default:
          throw new Error(
            'Cannot decrement date by dataset precision: invalid interval "{0}"'.
            format(interval)
          );
          break;
      }

      return newDate;

    }

    function incrementDateByHalfInterval(date, interval) {

      var newDate;

      switch (interval.toUpperCase()) {
        case 'DECADE':
          newDate = moment(date).add(5, 'year').toDate();
          break;
        case 'YEAR':
          newDate = moment(date).add(6, 'month').toDate();
          break;
        case 'MONTH':
          newDate = moment(date).add(15, 'day').toDate();
          break;
        case 'DAY':
          newDate = moment(date).add(12, 'hour').toDate();
          break;
        default:
          throw new Error(
            'Cannot increment date by dataset precision: invalid interval "{0}"'.
            format(interval)
          );
          break;
      }

      return newDate;

    }

    return {
      serializeFloatingTimestamp: serializeFloatingTimestamp,
      deserializeFloatingTimestamp: deserializeFloatingTimestamp,
      decrementDateByHalfInterval: decrementDateByHalfInterval,
      incrementDateByHalfInterval: incrementDateByHalfInterval
    };
  }

  angular.
    module('dataCards.services').
      factory('DateHelpers', DateHelpers);

})();
