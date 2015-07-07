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
        Rx.Observable.subscribeLatest(
          scope.$observe('cardModel').observeOnLatest('column').filter(_.isDefined),
          function(column) {
            scope.$safeApply(function() {
              if (column.hasOwnProperty('cardinality')) {
                scope.cardinality = parseInt(column.cardinality, 10);
              } else {
                scope.cardinality = 0;
              }
              scope.showCardinalityWarning = scope.cardinality >
                parseInt(Constants.COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD, 10);
              scope.availableCardTypes = column.availableCardTypes;
            });
          });

        scope.setCardType = function(cardType) {

          if (scope.cardModel === null ||
              scope.availableCardTypes.indexOf(cardType) === -1) {
            $log.error('Could not set card type of "{0}".'.format(cardType));
            return;
          }

          scope.$safeApply(function() {
            scope.cardModel.set('cardType', cardType);
          });

        };

        // Handle flyouts for visualization options and bar chart overflow warnings
        var EXCESSIVE_COLUMN_WARNING = '<div class="flyout-title">{0}</div>'.
          format(I18n.addCardDialog.columnChartWarning);

        FlyoutService.register({
          selector: '.visualization-type',
          render: function(el) {
            if (scope.showCardinalityWarning && $(el).hasClass('warn')) {
              return EXCESSIVE_COLUMN_WARNING;
            } else {
              var visualizationName = el.getAttribute('data-visualization-name');
              if (visualizationName === null) {
                return;
              }
              return '<div class="flyout-title">{0}</div>'.
                format(I18n.t('addCardDialog.visualizeFlyout', visualizationName));
            }
          },
          destroySignal: scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.warning-icon',
          render: _.constant(EXCESSIVE_COLUMN_WARNING),
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
