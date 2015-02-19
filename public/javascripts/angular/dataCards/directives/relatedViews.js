(function() {
  'use strict';

  function relatedViews(AngularRxExtensions, WindowState, Constants) {
    return {
      restrict: 'E',
      scope: {
        datasetPages: '='
      },
      templateUrl: '/angular_templates/dataCards/relatedViews.html',
      link: function($scope, element) {
        AngularRxExtensions.install($scope);
        var destroyStream = $scope.eventToObservable('$destroy');

        $scope.panelActive = false;

        var datasetPublisherPagesStream = $scope.observe('datasetPages').
          filter(_.isPresent).
          pluck('publisher');
        $scope.bindObservable('datasetPublisherPages', datasetPublisherPagesStream);
        $scope.togglePanel = function() {
          $scope.panelActive = !$scope.panelActive;
        };

        var toggleButton = element.find('.tool-panel-toggle-btn');
        var toggleBottom = toggleButton.offset().top + toggleButton.height();
        var relatedViewsList = element.find('.related-views-list');
        var offsetBottom = toggleBottom + Constants['RELATED_VIEWS_LIST_HEIGHT_OFFSET'];

        WindowState.windowSizeSubject.
          takeUntil(destroyStream).
          subscribe(function(windowDimensions) {
            var relatedViewsHeight = windowDimensions.height - offsetBottom;
            relatedViewsList.css({
              maxHeight: '{0}px'.format(relatedViewsHeight)
            });
          });

        WindowState.closeDialogEventObservable.
          filter(function(e) {
            return $scope.panelActive && $(e.target).closest(element).length === 0;
          }).
          takeUntil(destroyStream).
          subscribe(function() {
            $scope.safeApply(function() {
              $scope.panelActive = false;
            });
          });

      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('relatedViews', relatedViews);

})();
