(function() {
  'use strict';

  function spinner() {
    return {
      restrict: 'E',
      templateUrl: '/angular_templates/dataCards/spinner.html'
    };
  }

  angular.
    module('dataCards.directives').
    directive('spinner', spinner);

})();

