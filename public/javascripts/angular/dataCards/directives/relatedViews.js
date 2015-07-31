(function() {
  'use strict';

  function relatedViews(WindowState, Constants) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        datasetPages: '='
      },
      templateUrl: '/angular_templates/dataCards/relatedViews.html',
      link: function($scope, element) {
        var destroyStream = $scope.$destroyAsObservable(element);
        var datasetPagesObservable = $scope.$observe('datasetPages');

        $scope.panelActive = false;

        var datasetPublisherPagesSequence = datasetPagesObservable.
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

        $scope.$bindObservable('enablePublisherPages', enablePublisherPagesSequence);
        $scope.$bindObservable('datasetPublisherPages', datasetPublisherPagesSequence.startWith([]));
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

        // Hide the flannel when pressing escape or clicking outside the
        // tool-panel-main element.  Clicking on the button has its own
        // toggling behavior so it is excluded from this logic.
        WindowState.closeDialogEventObservable.
          filter(function(e) {
            if (!$scope.panelActive) { return false; }
            if (e.type === 'keydown') { return true; }

            var $target = $(e.target);
            var targetInsideFlannel = $target.closest('.tool-panel-main').length > 0;
            var targetIsButton = $target.is($(element).find('.tool-panel-toggle-btn'));
            return !targetInsideFlannel && !targetIsButton;
          }).
          takeUntil(destroyStream).
          subscribe(function() {
            $scope.$safeApply(function() {
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
