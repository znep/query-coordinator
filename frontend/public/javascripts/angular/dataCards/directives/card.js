var templateUrl = require('angular_templates/dataCards/card.html');

module.exports = function CardDirective(
  PolaroidService,
  ServerConfig,
  FlyoutService,
  VIFExportService,
  $timeout,
  I18n,
  rx) {
  const Rx = rx;

  return {
    restrict: 'E',
    scope: {
      model: '=',
      whereClause: '=',
      editMode: '=',
      interactive: '=',
      allowFilterChange: '=',
      cardDraggable: '=',
      chooserMode: '=',
      isGrabbed: '='
    },
    templateUrl: templateUrl,
    link: function($scope, element) {
      var model$ = $scope.$observe('model').filter(_.identity);
      var descriptionTruncatedContent;
      var descriptionElementsWithMaxSize;

      $scope.debugDataLens = ServerConfig.get('debug_data_lens');

      $scope.descriptionCollapsed = true;
      $scope.$bindObservable('expanded', model$.observeOnLatest('expanded'));

      $scope.$bindObservable('isCustomizableMap', model$.observeOnLatest('isCustomizableMap'));
      $scope.$bindObservable('isExportable', model$.observeOnLatest('isExportable'));
      $scope.$bindObservable('showDescription', model$.observeOnLatest('showDescription'));

      $scope.$bindObservable('description', model$.observeOnLatest('column.description'));

      $scope.$bindObservable(
        'cardType',
        Rx.Observable.combineLatest(
          model$,
          model$.observeOnLatest('cardType'),
          model$.observeOnLatest('column'),
          function(model, cardType, column) {

            if (!column.hasOwnProperty('defaultCardType')) {
              throw new Error(
                'Failed to assign cardType: could not find property ' +
                `defaultCardType on column ${JSON.stringify(column)}`
              );
            }

            if (!column.hasOwnProperty('availableCardTypes')) {
              throw new Error(
                'Failed to assign cardType: could not find property ' +
                `availableCardTypes on column ${JSON.stringify(column)}`
              );
            }

            // When the card type changes, clear custom titles.
            model.set('customTitle', undefined);

            // If the card metadata did not include an explicit cardType,
            // the Card model will have set it to null as a default. In
            // this case, we want to fall back to the default card type.
            if (cardType === null) {
              cardType = column.defaultCardType;
            }

            return (column.availableCardTypes.indexOf(cardType) > -1) ?
              cardType :
              'invalid';
          }
        )
      );

      function registerDebugFlyout() {
        // N.B.: Card models already have unique ids, but they can be shared across card directives.
        var uniqueId = _.uniqueId();
        element[0].setAttribute('data-card_directive_id', uniqueId);

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

        $scope.$on('filtered_query:complete', function(_, headers) {
          debugInfo.filteredResponseHeaders = headers;
        });

        $scope.$on('unfiltered_query:complete', function(_, headers) {
          debugInfo.unfilteredResponseHeaders = headers;
        });

        var selector = 'card[data-card_directive_id="' + uniqueId + '"] * .icon-table';
        FlyoutService.register({
          selector: selector,
          render: function() {
            var title = [
              '<div class="flyout-title">Card Debug Info</div>'
            ];

            var renderTime = [
              '<div class="flyout-row">',
                '<span class="flyout-cell">Render time</span>',
                `<span class="flyout-cell">${debugInfo.renderCompleteTime - debugInfo.renderStartTime} ms</span>`,
              '</div>'
            ];

            var filteredUsedRollups;
            if (_.isPresent(debugInfo.filteredResponseHeaders)) {
              filteredUsedRollups = [
                '<div class="flyout-row">',
                  '<span class="flyout-cell">Filtered query used rollups</span>',
                  `<span class="flyout-cell">${_.isPresent(debugInfo.filteredResponseHeaders['x-soda2-rollup'])}</span>`,
                '</div>'
              ];
            } else {
              filteredUsedRollups = [];
            }

            var unfilteredUsedRollups;
            if (_.isPresent(debugInfo.unfilteredResponseHeaders)) {
              unfilteredUsedRollups = [
                '<div class="flyout-row">',
                  '<span class="flyout-cell">Unfiltered query used rollups</span>',
                  `<span class="flyout-cell">${_.isPresent(debugInfo.unfilteredResponseHeaders['x-soda2-rollup'])}</span>`,
                '</div>'
              ];
            } else {
              unfilteredUsedRollups = [];
            }

            return _.flatten([title, renderTime, filteredUsedRollups, unfilteredUsedRollups]).join('');
          }
        });
      }
      registerDebugFlyout();

      var updateCardLayout = _.throttle(function(textHeight) {
        descriptionTruncatedContent.dotdotdot({
          height: textHeight,
          tolerance: 2
        });

        var isClamped = descriptionTruncatedContent.triggerHandler('isTruncated');

        $scope.$safeApply(function() {
          $scope.descriptionClamped = isClamped;
          $scope.animationsOn = element.closest('.customize-card-preview').length === 0;
        });

      }, 250, {leading: true, trailing: true});

      $scope.toggleExpanded = function() {
        $scope.model.page.toggleExpanded($scope.model);
      };

      $scope.customizeCard = function() {
        $scope.$emit('customize-card-with-model', $scope.model);
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

      $scope.downloadStateText = function(state) {

        // Handle non-default states common to all export modes.
        switch (state) {
          case 'success':
            return I18n.common.done;
          case 'error':
            return I18n.common.error;
          default:
            return I18n.common.download;
        }
      };

      $scope.exportCard = function(e) {

        function resetDownloadButton(delayMs) {
          $timeout(
            function() {
              delete $scope.downloadState;
              $scope.$emit('exit-export-card-visualization-mode');
            },
            delayMs
          );
        }

        // Prevent unwanted activity.
        if (e && e.metaKey) {
          return;
        }

        if (e) {
          e.preventDefault();
        }

        if ($scope.downloadState) {
          return;
        }

        // Indicate a busy state.
        $scope.downloadState = 'loading';

        $(e.target).blur();

        var vif = VIFExportService.exportVIF($scope.model.page, $scope.model.uniqueId, 'Polaroid Export', '');
        var url = '/view/vif.png';
        PolaroidService.download(url, vif).then(
          function() {
            $scope.$safeApply(function() {
              $scope.downloadState = 'success';
            });
          }, function() {
            $scope.$safeApply(function() {
              $scope.downloadState = 'error';
            });
          }
        )['finally'](function() {
          resetDownloadButton(2000);
        });
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
      var description = element.find('.card-text');
      Rx.Observable.subscribeLatest(
        description.observeDimensions(),
        dimensions$,
        function(descriptionDimensions, elementDimensions) {
          element.find('.card-visualization').height(
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
};
