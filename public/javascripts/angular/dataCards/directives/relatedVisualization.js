(function() {
  'use strict';

  function relatedVisualization() {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/angular_templates/dataCards/relatedVisualization.html',
      link: function(scope) {
        scope.humanReadableColumnList = scope.visualization.columns.map(
          scope.columnNameToReadableNameFn
        ).join(', ');
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('relatedVisualization', relatedVisualization);

})();
