(function() {
  'use strict';

  function relatedViews(AngularRxExtensions, WindowState, Constants) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        datasetPages: '='
      },
      templateUrl: '/angular_templates/dataCards/relatedViews.html',
      link: function($scope, element) {
        AngularRxExtensions.install($scope);
        var destroyStream = $scope.observeDestroy(element);

        $scope.panelActive = false;

        var datasetPublisherPagesSequence = $scope.observe('datasetPages').
          filter(_.isPresent).
          pluck('publisher').
          map(function(datasetPages) {
            return _.reject(datasetPages, function(datasetPage) {
              return datasetPage.pageId === $scope.page.id;
            });
          });

        var enablePublisherPagesSequence = datasetPublisherPagesSequence.
          map(function(pages) {
            return pages.length > 0;
          }).
          startWith(true);

        $scope.bindObservable('enablePublisherPages', enablePublisherPagesSequence);
        $scope.bindObservable('datasetPublisherPages', datasetPublisherPagesSequence.startWith([]));
        $scope.togglePanel = function() {
          $scope.panelActive = !$scope.panelActive;
        };

        var toolPanel = element.find('.tool-panel');
        var toggleButton = element.find('.tool-panel-toggle-btn');
        var toggleBottom = toggleButton.offset().top + toggleButton.height();
        var relatedViewsList = element.find('.related-views-list');
        var offsetBottom = toggleBottom + Constants['RELATED_VIEWS_LIST_HEIGHT_OFFSET'];

        relatedViewsList.preventBodyScroll();

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
            return $scope.panelActive && $(e.target).closest(toolPanel).length === 0;
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
