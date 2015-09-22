(function() {
  'use strict';

  function visualizationTypeSelector(Constants, FlyoutService, $log, I18n) {
    return {
      restrict: 'E',
      scope: {
        cardModel: '=',

        // Array of card types.
        // Optional, if set will limit available card types to the given list.
        supportedCardTypes: '=?'
      },
      templateUrl: '/angular_templates/dataCards/visualizationTypeSelector.html',
      link: function(scope, element) {
        var cardModel$ = scope.$observe('cardModel').filter(_.isPresent);
        var cardModelColumn$ = cardModel$.observeOnLatest('column').filter(_.isDefined);
        var cardType$ = cardModel$.observeOnLatest('cardType');
        var FLYOUT_TEMPLATE = '<div class="flyout-title">{0}</div>';

        // Sometimes the histogram renders as a column chart. See 8.20.
        function histogramIsRenderingAsColumnChart(visualizationType, cardType) {
          return visualizationType === 'columnChart' && cardType === 'histogram';
        }

        cardModel$.observeOnLatest('visualizationType').
          withLatestFrom(cardType$, histogramIsRenderingAsColumnChart).
          subscribe(function(showHistogramColumnChartWarning) {
            scope.$safeApply(function() {
              scope.showHistogramColumnChartWarning = showHistogramColumnChartWarning;
            });
          });

        Rx.Observable.subscribeLatest(
          cardModelColumn$,
          scope.$observe('supportedCardTypes'),
          function(column, supportedCardTypes) {
            // If scope.supportedCardTypes is undefined, we support all card types.
            supportedCardTypes = supportedCardTypes || column.availableCardTypes;

            scope.$safeApply(function() {
              scope.availableCardTypes = _.intersection(column.availableCardTypes, supportedCardTypes);

              // Determine whether or not to show cardinality warning.
              scope.cardinality = parseInt(_.get(column, 'cardinality', 0), 10);
              scope.showCardinalityWarning = scope.cardinality > Constants.COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD;
            });
          }
        );

        scope.setCardType = function(cardType) {
          if (_.isNull(scope.cardModel) || !_.contains(scope.availableCardTypes, cardType)) {
            $log.error('Could not set card type of "{0}".'.format(cardType));
            return;
          }

          scope.$safeApply(function() {
            scope.cardModel.set('cardType', cardType);
          });
        };

        FlyoutService.register({
          selector: '.visualization-type',
          render: function(el) {
            var visualizationName = $(el).attr('data-visualization-name');
            var flyoutMessage = I18n.t('addCardDialog.visualizeFlyout.{0}'.format(visualizationName));

            if (scope.showCardinalityWarning && $(el).hasClass('icon-bar-chart')) {
              flyoutMessage = I18n.addCardDialog.columnChartWarning;
            } else if (scope.showHistogramColumnChartWarning && $(el).hasClass('icon-distribution')) {
              flyoutMessage = I18n.addCardDialog.histogramColumnChartWarning;
            }

            return FLYOUT_TEMPLATE.format(flyoutMessage);
          },
          destroySignal: scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.icon-bar-chart .icon-warning',
          render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.columnChartWarning)),
          positionOn: function(el) {
            return $(el).closest('.visualization-type')[0];
          },
          destroySignal: scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.icon-distribution .icon-warning',
          render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.histogramColumnChartWarning)),
          positionOn: function(el) {
            return $(el).closest('.visualization-type')[0];
          },
          persistOnMousedown: true,
          destroySignal: scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.icon-region .icon-warning',
          render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.choroplethWarning)),
          positionOn: function(el) {
            return $(el).closest('.visualization-type')[0];
          },
          persistOnMousedown: true,
          destroySignal: scope.$destroyAsObservable(element)
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('visualizationTypeSelector', visualizationTypeSelector);

})();
