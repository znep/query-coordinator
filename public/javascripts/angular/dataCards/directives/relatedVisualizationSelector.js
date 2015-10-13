(function() {
  'use strict';

  var socrata = window.socrata;
  var utils = socrata.utils;

  function getCardTypeFromVisualization(visualization) {
    utils.assert(
      visualization.cards.length === 1,
      'Related Visualization Selector requires exactly one card.'
    );

    var card = visualization.cards[0];
    return card.cardType;
  }

  /**
   * Lets user select from a list of a dataset's related visualizations.
   *
   * Expects on scope:
   *  - columnNameToReadableNameFn (string) => string: Input. A function that maps column API names to human names.
   *  - relatedVisualizations [Object]: Input. An array of page metadata blobs representing the related visualizations.
   *  - highlightedColumns [string]: Input. An array of column API names.
   *                                 Visualizations using these columns will be highlighted.
   *
   * Emits related-visualization when the user selects. The payload is the page metadata blob.
   */
  function relatedVisualizationSelector(FlyoutService, I18n) {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/angular_templates/dataCards/relatedVisualizationSelector.html',
      link: function(scope) {

        utils.assert(
          _.isFunction(scope.columnNameToReadableNameFn),
          'columnNameToReadableNameFn expected to be a function on the scope'
        );

        scope.onVisualizationSelected = function(visualization) {
          scope.$emit('related-visualization-selected', visualization);
        };

        scope.shouldDisable = function(visualization) {
          var cardType = getCardTypeFromVisualization(visualization);
          return !_.contains(scope.supportedCardTypes, cardType);
        };

        scope.shouldDim = function(visualization) {
          if (_.isEmpty(scope.highlightedColumns)) {
            return false;
          } else {
            return !_.contains(scope.highlightedColumns, visualization.sourceVif.columnName);
          }
        };

        scope.shouldHighlightSourceColumn = function(visualization) {
          return _.contains(scope.highlightedColumns, visualization.sourceVif.columnName);
        };

        scope.iconClass = function(visualization) {
          var cardType = getCardTypeFromVisualization(visualization);

          return {
            'icon-bar-chart': cardType === 'column',
            'icon-line-chart': cardType === 'timeline',
            'icon-map': cardType === 'feature',
            'icon-region': cardType === 'choropleth',
            'icon-distribution': cardType === 'histogram'
          };
        };

        FlyoutService.register({
          'selector': '.visualization-disabled, .visualization-disabled *',
          'render': _.constant(I18n.t('relatedVisualizationSelector.visualizationNotSupported')),
          'trackCursor': true
        });

        scope.$watch('[relatedVisualizations, supportedCardTypes]', function() {
          // Sort by columnName and title, then place all disabled visualizations
          // at end of list.
          var orderedVisualizations = _.chain(scope.relatedVisualizations).
            sortByAll(
              'sourceVif.columnName',
              'sourceVif.title'
            ).
            groupBy(function(visualization) {
              return scope.shouldDisable(visualization);
            }
          ).value();
          scope.orderedVisualizations = (orderedVisualizations['false'] || []).
            concat(orderedVisualizations['true'] || []);
        }, true);
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('relatedVisualizationSelector', relatedVisualizationSelector);

})();
