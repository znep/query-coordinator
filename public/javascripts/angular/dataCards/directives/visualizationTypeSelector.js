(function() {
  'use strict';

  function visualizationTypeSelector(Constants, FlyoutService, $log, I18n) {
    return {
      restrict: 'E',
      scope: {
        cardModel: '='
      },
      templateUrl: '/angular_templates/dataCards/visualizationTypeSelector.html',
      link: function(scope, element) {
        var cardModel$ = scope.$observe('cardModel').filter(_.isPresent);
        var cardModelColumn$ = cardModel$.observeOnLatest('column').filter(_.isDefined);
        var FLYOUT_TEMPLATE = '<div class="flyout-title">{0}</div>';

        cardModelColumn$.subscribe(function(column) {
          scope.$safeApply(function() {
            scope.availableCardTypes = column.availableCardTypes;

            // Determine whether or not to show cardinality warning.
            scope.cardinality = parseInt(_.get(column, 'cardinality', 0), 10);
            scope.showCardinalityWarning = scope.cardinality > Constants.COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD;
          });
        });

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
            }

            return FLYOUT_TEMPLATE.format(flyoutMessage);
          },
          destroySignal: scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.icon-bar-chart .warning-icon',
          render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.columnChartWarning)),
          positionOn: function(el) {
            return el.closest('.visualization-type');
          },
          destroySignal: scope.$destroyAsObservable(element)
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('visualizationTypeSelector', visualizationTypeSelector);

})();
