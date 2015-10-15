(function() {
  'use strict';

  /**
   * Places a classic visualization iframe on the page.
   */
  function classicVisualizationPreviewer($q) {
    return {
      restrict: 'E',
      scope: {
        classicVisualization: '='
      },
      templateUrl: '/angular_templates/dataCards/classicVisualizationPreviewer.html',
      link: function(scope, element) {
        var iframe = element.find('iframe')[0];
        var deferred = $q.defer();

        scope.$watch('classicVisualization', function() {
          if (scope.classicVisualization) {
            if (!iframe.src) {
              iframe.src = '/component/visualization/v0/show';
              $(iframe).one('load', function() {
                deferred.resolve();
              });
            }

            deferred.promise.then(function() {
              iframe.contentWindow.renderVisualization(scope.classicVisualization.data);
            });
          }
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('classicVisualizationPreviewer', classicVisualizationPreviewer);

})();
