(function() {
  'use strict';

  function FromNowFilter() {
    return function(input) {
      var momentObj = moment(input, moment.ISO_8601);
      if (momentObj.isValid()) {
        return momentObj.fromNow();
      } else {
        return '';
      }
    }
  }

  angular.
    module('socrataCommon.filters').
    filter('fromNow', FromNowFilter);

})();
