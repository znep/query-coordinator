(function() {
  'use strict';

  function CardDirective(DownloadService, $timeout, I18n) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '=',
        'editMode': '=',
        'interactive': '=',
        'isChoosingForExport': '=',
        'isGrabbed': '='
      },
      templateUrl: '/angular_templates/dataCards/card.html',
      link: function($scope, element) {
        var modelSubject = $scope.$observe('model').filter(_.identity);
        var datasetObservable = modelSubject.pluck('page').observeOnLatest('dataset');
        var columns = datasetObservable.observeOnLatest('columns');

        $scope.descriptionCollapsed = true;
        $scope.$bindObservable('expanded', modelSubject.observeOnLatest('expanded'));

        $scope.$bindObservable('isCustomizable', modelSubject.observeOnLatest('isCustomizable'));
        $scope.$bindObservable('isExportable', modelSubject.observeOnLatest('isExportable'));
        $scope.$bindObservable('showDescription', modelSubject.observeOnLatest('showDescription'));

        $scope.$bindObservable('description', modelSubject.observeOnLatest('column.description'));

        var updateCardLayout = _.throttle(function(textHeight) {
          descriptionTruncatedContent.dotdotdot({
            height: textHeight,
            tolerance: 2
          });

          var isClamped = descriptionTruncatedContent.triggerHandler('isTruncated');

          $scope.$safeApply(function() {
            $scope.descriptionClamped = isClamped;
            $scope.animationsOn = true;
          });

        }, 250, {leading: true, trailing: true});

        $scope.toggleExpanded = function() {
          $scope.model.page.toggleExpanded($scope.model);
        };

        $scope.customizeCardIfCustomizable = function(modelIsCustomizable) {
          if (modelIsCustomizable) {
            $scope.$emit('customize-card-with-model', $scope.model);
          }
        };

        $scope.deleteCard = function() {
          $scope.$emit('delete-card-with-model', $scope.model);
        };

        $scope.downloadUrl = './' + $scope.model.page.id + '/' + $scope.model.fieldName + '.png';

        $scope.downloadStateText = function(state) {
          switch(state) {
            case 'success':
              return I18n.common.downloading;
            case 'error':
              return I18n.common.error;
            default:
              return I18n.common.download;
          }
        };

        $scope.downloadPng = function(e) {

          function resetDownloadButton() {
            $timeout(
              function() {
                delete $scope.downloadState;
              },
              2000
            );
          }

          if (e && e.metaKey) {
            return;
          }

          if (e) {
            e.preventDefault();
          }

          if ($scope.downloadState) {
            return;
          }

          $scope.downloadState = 'loading';

          $(e.target).blur();

          DownloadService.download($scope.downloadUrl).then(
            function success() {

              $scope.$safeApply(function() {
                $scope.downloadState = 'success';
                resetDownloadButton();
              });

            }, function error() {

              $scope.$safeApply(function() {
                $scope.downloadState = 'error';
                resetDownloadButton();
              });

            }
          );

        };

        var descriptionTruncatedContent = element.find('.description-truncated-content');
        var descriptionElementsWithMaxSize = element.
          find('.description-expanded-wrapper, .description-expanded-content');

        var dimensionsObservable = element.observeDimensions();

        // CORE-5475: set <card> height to the height of its parent <card-spot> to prevent
        // the height from filling the whole screen on drag.
        dimensionsObservable.
          map(function() { return element.parent().height(); }).
          // Only set the height if it's > 0 to avoid height issues where we use cards in other
          // places, such as customizeCardDialog. (See CORE-5814)
          filter(function(parentHeight) { return parentHeight > 0; }).
          subscribe(function(parentHeight) {  element.css('height', parentHeight); });

        // Give the visualization all the height that the description isn't using.
        // Note that we set the height on a wrapper instead of the card-visualization itself.
        // This is because the card-visualization DOM node itself can be ripped out and replaced
        // by angular at any time (typically when the card-visualization template finishes loading
        // asynchronously).
        // See: https://github.com/angular/angular.js/issues/8877
        var description = element.find('.card-text');
        Rx.Observable.subscribeLatest(
          description.observeDimensions(),
          dimensionsObservable,
          function(descriptionDimensions, elementDimensions) {
            element.find('.card-visualization-wrapper').height(
              elementDimensions.height - description.outerHeight(true)
            );
          });

        Rx.Observable.subscribeLatest(
          dimensionsObservable,
          modelSubject.observeOnLatest('column.description'),
          function(dimensions, descriptionText) {
            // Manually update the binding now, because Angular doesn't know that dotdotdot messes with
            // the text.
            descriptionTruncatedContent.text(descriptionText);

            var availableSpace = dimensions.height -
              descriptionTruncatedContent.offsetParent().position().top;

            descriptionElementsWithMaxSize.css('max-height', availableSpace);

            updateCardLayout(parseInt(descriptionTruncatedContent.css('line-height'), 10) * 2);

          });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('card', CardDirective);

})();
