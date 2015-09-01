(function() {
  'use strict';

  function CardDirective(DownloadService, ServerConfig, FlyoutService, $timeout, I18n) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '=',
        'editMode': '=',
        'interactive': '=',
        'cardDraggable': '=',
        'isChoosingForExport': '=',
        'isGrabbed': '='
      },
      templateUrl: '/angular_templates/dataCards/card.html',
      link: function($scope, element) {
        var model$ = $scope.$observe('model').filter(_.identity);
        var descriptionTruncatedContent;
        var descriptionElementsWithMaxSize;

        $scope.debugDataLens = ServerConfig.get("debugDataLens");

        $scope.descriptionCollapsed = true;
        $scope.$bindObservable('expanded', model$.observeOnLatest('expanded'));

        $scope.$bindObservable('isCustomizable', model$.observeOnLatest('isCustomizable'));
        $scope.$bindObservable('isCustomizableMap', model$.observeOnLatest('isCustomizableMap'));
        $scope.$bindObservable('isExportable', model$.observeOnLatest('isExportable'));
        $scope.$bindObservable('showDescription', model$.observeOnLatest('showDescription'));

        $scope.$bindObservable('description', model$.observeOnLatest('column.description'));

        // N.B.: Card models already have unique ids, but they can be shared across card directives.
        var uniqueId = _.uniqueId();
        element[0].dataset['card_directive_id'] = uniqueId;

        // DEBUG INFO STUFF

        var debugInfo = {
          unfilteredResponseHeaders: undefined,
          filteredResponseHeaders: undefined,
          renderStartTime: undefined,
          renderCompleteTime: undefined
        };

        $scope.$on('render:start', function(_, event) {
          debugInfo.renderStartTime = event.timestamp;
        });

        $scope.$on('render:complete', function(_, event) {
          debugInfo.renderCompleteTime = event.timestamp;
        });

        $scope.$on('response_headers:filtered', function(_, headers) {
          debugInfo.filteredResponseHeaders = headers;
        });

        $scope.$on('response_headers:unfiltered', function(_, headers) {
          debugInfo.unfilteredResponseHeaders = headers;
        });

        var selector = "card[data-card_directive_id='" + uniqueId + "'] * .icon-table";
        FlyoutService.register({
          // use data
          selector: selector,
          render: function() {
            var title = [
                '<div class="flyout-title">Card Debug Info</div>'
            ];

            var renderTime = [
                '<div class="flyout-row">',
                  '<span class="flyout-cell">Render time</span>',
                  '<span class="flyout-cell">{0} ms</span>'
                      .format(debugInfo.renderCompleteTime - debugInfo.renderStartTime),
                '</div>'
            ];

            var filteredUsedRollups;
            if(_.isPresent(debugInfo.filteredResponseHeaders)) {
              filteredUsedRollups = [
                '<div class="flyout-row">',
                  '<span class="flyout-cell">Filtered query used rollups</span>',
                  '<span class="flyout-cell">{0}</span>'
                      .format(_.isPresent(debugInfo.filteredResponseHeaders['x-soda2-rollup'])),
                '</div>'
              ];
            } else {
              filteredUsedRollups = [];
            }

            var unfilteredUsedRollups;
            if(_.isPresent(debugInfo.unfilteredResponseHeaders)) {
              unfilteredUsedRollups = [
                '<div class="flyout-row">',
                  '<span class="flyout-cell">Unfiltered query used rollups</span>',
                  '<span class="flyout-cell">{0}</span>'
                      .format(_.isPresent(debugInfo.unfilteredResponseHeaders['x-soda2-rollup'])),
                '</div>'
              ];
            } else {
              unfilteredUsedRollups = [];
            }

            return _.flatten([title, renderTime, filteredUsedRollups, unfilteredUsedRollups]).join('');
          }
        });

        // END DEBUG INFO STUFF

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
        $scope.$on('delete-card-with-model-delegate', function() {
          // Preserve the table card even during bulk delete.
          if ($scope.model.fieldName !== '*') {
            $scope.deleteCard();
          }
        });

        $scope.downloadUrl = './' + $scope.model.page.id + '/' + $scope.model.fieldName + '.png';

        $scope.downloadStateText = function(state) {
          switch (state) {
            case 'success':
              return I18n.common.done;
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
                $scope.$emit('exit-export-card-visualization-mode');
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

        descriptionTruncatedContent = element.find('.description-truncated-content');
        descriptionElementsWithMaxSize = element.
          find('.description-expanded-wrapper, .description-expanded-content');

        var dimensions$ = element.observeDimensions();

        if ($scope.cardDraggable) {

          // CORE-5475: set <card> height to the height of its parent <card-spot> to prevent
          // the height from filling the whole screen on drag.
          dimensions$.
            map(function() { return element.parent().height(); }).
            // Only set the height if it's > 0 to avoid height issues where we use cards in other
            // places, such as customizeCardDialog. (See CORE-5814)
            filter(function(parentHeight) { return parentHeight > 0; }).
            subscribe(function(parentHeight) { element.css('height', parentHeight); });
        }

        // Give the visualization all the height that the description isn't using.
        // Note that we set the height on a wrapper instead of the card-visualization itself.
        // This is because the card-visualization DOM node itself can be ripped out and replaced
        // by angular at any time (typically when the card-visualization template finishes loading
        // asynchronously).
        // See: https://github.com/angular/angular.js/issues/8877
        var description = element.find('.card-text');
        Rx.Observable.subscribeLatest(
          description.observeDimensions(),
          dimensions$,
          function(descriptionDimensions, elementDimensions) {
            element.find('.card-visualization-wrapper').height(
              elementDimensions.height - description.outerHeight(true)
            );
          });

        Rx.Observable.subscribeLatest(
          dimensions$,
          model$.observeOnLatest('column.description'),
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
