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
          return !_.contains(scope.supportedCardTypes, visualization.type) && visualization.format === 'page_metadata';
        };

        scope.shouldHighlightSourceColumn = function(visualization) {
          return _.intersection(scope.highlightedColumns, visualization.columns).length > 0;
        };

        scope.iconClass = function(visualization) {
          var type = visualization.type;

          // This handles both Data Lens card types and classic
          // visualization chart types.
          switch (type) {
            case 'column':
            case 'stackedcolumn':
            case 'bar':
            case 'stackedbar':
              return 'icon-bar-chart';
            case 'line':
            case 'area':
            case 'histogram':
              return 'icon-distribution';
            case 'timeline':
              return 'icon-line-chart';
            case 'map':
            case 'feature':
              return 'icon-map';
            case 'choropleth':
              return 'icon-region';
            default:
              return 'icon-chart';
          }
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
              'primaryColumn',
              'title'
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
