(function() {
  'use strict';

  function DateHelpers() {

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
      decrementDateByHalfInterval: decrementDateByHalfInterval,
      incrementDateByHalfInterval: incrementDateByHalfInterval
    };

  }

  angular.
    module('dataCards.services').
      factory('DateHelpers', DateHelpers);

})();
