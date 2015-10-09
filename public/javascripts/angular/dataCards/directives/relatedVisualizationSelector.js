(function() {
  'use strict';

  var socrata = window.socrata;
  var utils = socrata.utils;

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
  function relatedVisualizationSelector() {
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
          utils.assert(visualization.cards.length === 1, 'Related Visualization Selector requires exactly one card.');

          var card = visualization.cards[0];

          return {
            'icon-bar-chart': card.cardType === 'column',
            'icon-line-chart': card.cardType === 'timeline',
            'icon-map': card.cardType === 'feature'
          };
        };
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('relatedVisualizationSelector', relatedVisualizationSelector);

})();
