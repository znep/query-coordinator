const angular = require('angular');
const TimelineChart = require('socrata-visualizations').views.TimelineChart;
const templateUrl = require('angular_templates/dataCards/timelineChart.html');

function timelineChart(
  $timeout,
  FlyoutService,
  rx,
  TimelineChartService) {

  const Rx = rx;

  return {
    restrict: 'E',
    scope: true,
    controller: 'TimelineChartController',
    templateUrl: templateUrl,
    link: function(scope, element) {
      var chartData$ = scope.$observe('chartData');
      var precision$ = scope.$observe('precision');
      var rowDisplayUnit$ = scope.$observe('rowDisplayUnit');
      var activeFilters$ = scope.$observe('activeFilters');

      if (scope.allowFilterChange) {
        element.addClass('filterable');
      }

      const timelineChartElement = element.find('.timeline-chart-wrapper');

      // Set up flyouts
      const flyoutSelectors = [
        '.timeline-chart-highlight-target',
        '.x-tick-label',
        '.timeline-chart-clear-selection-label',
        '.timeline-chart-clear-selection-button',
        '.selection-marker',
        '.datum-label'
      ].join(', ');

      let flyoutData = {};

      function renderFlyout() {
        return flyoutData.html;
      }

      FlyoutService.register({
        selector: flyoutSelectors,
        render: renderFlyout,
        positionOn: function() {
          return _.isNull(flyoutData.element) ? undefined : flyoutData.element;
        }
      });

      scope.$destroyAsObservable(element).subscribe(function() {
        FlyoutService.deregister(flyoutSelectors, renderFlyout);
      });

      // Set up event handlers
      function handleFlyoutEvent(event) {
        const payload = event.originalEvent.detail;

        if (_.isNull(payload)) {
          flyoutData.element = null;
          return;
        }

        flyoutData.element = payload.element;
        flyoutData.html = TimelineChartService.renderFlyout(payload);
      }

      function handleFilterEvent(event) {
        const payload = event.originalEvent.detail;
        scope.$emit('filter-timeline-chart', payload);
      }

      timelineChartElement.on('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', handleFlyoutEvent);
      timelineChartElement.on('SOCRATA_VISUALIZATION_TIMELINE_FILTER', handleFilterEvent);

      scope.$destroyAsObservable(element).subscribe(function() {
        timelineChartElement.off('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', handleFlyoutEvent);
        timelineChartElement.off('SOCRATA_VISUALIZATION_TIMELINE_FILTER', handleFilterEvent);
      });

      // Create visualization
      const timelineChartConfig = TimelineChartService.getVisualizationConfig(
        scope.rowDisplayUnit,
        scope.allowFilterChange
      );

      const timelineChartVisualization = new TimelineChart(timelineChartElement, timelineChartConfig);

      // Render function and subscription
      function render(cardDimensions, qfbDimensions, chartData, precision, rowDisplayUnit, activeFilters) {
        // qfbDimensions is not actually used, it is observed to update the cached chart offsets

        if (!_.isDefined(chartData) || _.isNull(chartData) || !_.isDefined(precision)) {
          return;
        }

        // Analytics
        scope.$emit('render:start', {
          source: `timelineChart_${scope.$id}`,
          timestamp: _.now()
        });

        timelineChartElement.width(cardDimensions.width);
        timelineChartElement.height(cardDimensions.height);

        const options = {
          precision,
          activeFilters,
          unit: TimelineChartService.getUnitConfiguration(rowDisplayUnit)
        };

        timelineChartVisualization.render(chartData, options);

        // Analytics
        $timeout(function() {
          scope.$emit('render:complete', {
            source: `timelineChart_${scope.$id}`,
            timestamp: _.now()
          });
        });
      }

      const renderTriggers = [
        element.closest('.card-visualization').observeDimensions(),
        element.closest('.cards-content').find('.quick-filter-bar').observeDimensions(),
        chartData$,
        precision$,
        rowDisplayUnit$,
        activeFilters$
      ];

      Rx.Observable.subscribeLatest(renderTriggers, render);
    }
  };
}

angular.
  module('dataCards.directives').
  directive('timelineChart', timelineChart);
