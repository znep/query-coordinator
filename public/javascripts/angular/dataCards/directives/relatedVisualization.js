(function() {
  'use strict';

  function relatedVisualization() {
    return {
      restrict: 'E',
      templateUrl: '/angular_templates/dataCards/relatedVisualization.html'
    };
  }

  angular.
    module('dataCards.directives').
      directive('relatedVisualization', relatedVisualization);

})();
