(function() {
  'use strict';

  function FromNowFilter(moment) {
    return function(input) {
      var momentObj = moment(input);
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
