angular.module('socrataCommon.directives').directive('columnChart', function($parse, $timeout, FlyoutService, I18n, FormatService) {

  'use strict';

  return {
    restrict: 'E',
    scope: {
      chartData: '=',
      showFiltered: '=',
      expanded: '=',
      rowDisplayUnit: '='
    },
    link: function(scope, element, attrs) {
      var chartDataObservable = scope.$observe('chartData');
      var showFilteredObservable = scope.$observe('showFiltered');
      var expandedObservable = scope.$observe('expanded');
      var rowDisplayUnitObservable = scope.$observe('rowDisplayUnit');

      if (_.isEmpty(element.closest('.card-visualization'))) {
        throw new Error('[columnChart] column-chart is missing a .card-visualization (grand)parent.');
      }

      element.parent().delegate('.truncation-marker', 'click', function(event) {
        scope.$apply(function() {
          scope.$emit('column-chart:truncation-marker-clicked', event);
        });
      });

      FlyoutService.register({
        selector: '.truncation-marker',
        render: _.constant('<div class="flyout-title">{0}</div>'.format(I18n.flyout.expand)),
        destroySignal: scope.$destroyAsObservable(element)
      });

      element.parent().delegate('.bar-group, .labels .label .contents span', 'click', function(event) {
        var clickedDatum = d3.select(event.currentTarget).datum();
        scope.$apply(function() {
          scope.$emit('column-chart:datum-clicked', clickedDatum);
        });
      });

      var config = {
        localization: {
          'NO_VALUE': I18n.common.noValue
        }
      };
      var columnChart = new socrata.visualizations.Column(element, config);

      Rx.Observable.subscribeLatest(
        element.closest('.card-visualization').observeDimensions().map(function(dimensions) {
          return {
            width: Math.max(dimensions.width, 0),
            height: Math.max(dimensions.height, 0)
          };
        }),
        chartDataObservable,
        showFilteredObservable,
        expandedObservable,
        rowDisplayUnitObservable,
        function(cardVisualizationDimensions, chartData, showFiltered, expanded, rowDisplayUnit) {
          if (!chartData) {
            return undefined;
          }
          scope.$emit('render:start', { source: 'columnChart_{0}'.format(scope.$id), timestamp: _.now() });

          var chartRenderOptions = {
            expanded: expanded,
            rowDisplayUnit: rowDisplayUnit,
            showFiltered: showFiltered
          };
          columnChart.render(chartData, chartRenderOptions);

          // Yield execution to the browser to render, then notify that render is complete
          $timeout(function() {
            scope.$emit('render:complete', { source: 'columnChart_{0}'.format(scope.$id), timestamp: _.now() });
          });
        }
      );
      scope.$destroyAsObservable(element).subscribe(function() {
        element.parent().undelegate();
        element.find('.chart-scroll').undelegate();
      });
    }
  };

});
