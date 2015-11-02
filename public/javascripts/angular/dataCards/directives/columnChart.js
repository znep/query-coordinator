angular.module('socrataCommon.directives').directive('columnChart', function($parse, $timeout, FlyoutService, I18n, PluralizeService) {

  'use strict';

  return {
    restrict: 'E',
    scope: true,
    link: function(scope, element) {
      var cardData$ = scope.$observe('cardData');
      var isFiltered$ = scope.$observe('isFiltered');
      var expanded$ = scope.$observe('expanded');
      var showAllLabels$ = scope.$observe('showAllLabels');
      var rowDisplayUnit$ = scope.$observe('rowDisplayUnit');
      var columnChartConfig;
      var columnChart;
      var lastFlyoutData;
      var flyoutSelectors = [
        '.bar-group.active',
        '.bar-group.active .bar',
        '.labels .label .contents span:not(.icon-close)'
      ];

      if (_.isEmpty(element.closest('.card-visualization'))) {
        throw new Error('[columnChart] column-chart is missing a .card-visualization (grand)parent.');
      }

      FlyoutService.register({
        selector: '.truncation-marker',
        render: _.constant('<div class="flyout-title">{0}</div>'.format(I18n.flyout.expand)),
        destroySignal: scope.$destroyAsObservable(element)
      });

      FlyoutService.register({
        selector: flyoutSelectors.join(', '),
        render: renderFlyout,
        positionOn: function(target) {

          if (!lastFlyoutData) {
            return undefined;
          }

          var barName;
          var barGroup;
          var unfilteredValue;
          var filteredValue;
          var flyoutTarget;

          // If we're hovering over a .bar within
          // .bar-group, update the target reference.
          if ($(target).is('.bar-group.active .bar')) {
            target = $(target).parent().get(0);
          }

          // To string and escape backslashes and quotes
          var escapeBarName = function(name) {
            return String(name).
              replace(/\\/g, '\\\\').
              replace(/"/g, '\\\"');
          };

          barName = escapeBarName(lastFlyoutData.title);
          barGroup = $(target).closest(element).
            find('.bar-group').
            filter(function() { return String($(this).data('bar-name')) === barName; }).
            get(0);


          if (_.isDefined(barGroup)) {

            // If the bar is hidden, display the flyout over the label.
            if (!$(barGroup).is(':visible')) {
              return target;
            }

            // Save the unfiltered and filtered values.
            unfilteredValue = d3.select(barGroup).datum().total;
            filteredValue = d3.select(barGroup).datum().filtered;

            // Position the flyout over the bar (filtered v. unfiltered)
            // with the greater value.
            if (filteredValue > unfilteredValue) {
              flyoutTarget = $(barGroup).find('.filtered').get(0);
            } else {
              flyoutTarget = $(barGroup).find('.unfiltered').get(0);
            }

            return flyoutTarget;
          }
        },
        destroySignal: scope.$destroyAsObservable(element)
      });

      FlyoutService.register({
        selector: '.labels .label .contents .icon-close',
        render: _.constant('<div class="flyout-title">{0}</div>'.format(I18n.flyout.clearFilter)),
        destroySignal: scope.$destroyAsObservable(element)
      });

      // Render the content of the column chart flyout by grabbing
      // the parent barGroup element's d3 data and constructing
      // the markup of the flyout.
      function renderFlyout(target) {

        if (!lastFlyoutData) {
          return undefined;
        }

        var data = lastFlyoutData;
        var flyoutContent;
        var flyoutSpanClass;
        var $target = $(target);

        // // If we're hovering over a .bar within
        // // .bar-group, update the target reference.
        if ($target.is('.bar-group.active .bar')) {
          target = $target.parent().get(0);
        }

        // // Make sure that target is defined before we
        // // start using it to grab data and build the
        // // flyout content.
        if (!_.isUndefined(target) && !_.isUndefined(data)) {

          flyoutContent = [
            '<div class="flyout-title">{0}</div>',
            '<div class="flyout-row">',
              '<span class="flyout-cell">{1}</span>',
              '<span class="flyout-cell">{2}</span>',
            '</div>'
          ];

          // If we are showing filtered data, then
          // show the filtered data on the flyout.
          if (_.has(data, 'filteredValue')) {

            flyoutSpanClass = 'emphasis';
            flyoutContent.push(
              '<div class="flyout-row">',
                '<span class="flyout-cell {3}">{4}</span>',
                '<span class="flyout-cell {3}">{5}</span>',
              '</div>');

            // If we are hovering over a bar we are
            // currently filtering by, then display a special
            // flyout message.
            if (data.selected) {

              flyoutSpanClass = 'is-selected';
              flyoutContent.push(
                '<div class="flyout-row">',
                  '<span class="flyout-cell">&#8203;</span>',
                  '<span class="flyout-cell">&#8203;</span>',
                '</div>',
                '<div class="flyout-row">',
                  '<span class="flyout-cell">{6}</span>',
                  '<span class="flyout-cell"></span>',
                '</div>');
            }

            flyoutContent = flyoutContent.
              join('').
              format(
                _.escape(data.title),
                data.unfilteredValueLabel,
                _.escape(data.unfilteredValue),
                flyoutSpanClass,
                data.filteredValueLabel,
                _.escape(data.filteredValue),
                data.selectedNotice
              );

          } else {

            flyoutContent = flyoutContent.
              join('').
              format(
                _.escape(data.title),
                data.unfilteredValueLabel,
                _.escape(data.unfilteredValue)
              );

          }

          return flyoutContent;
        }
      }

      var initialRowDisplayUnit = scope.rowDisplayUnit || I18n.common.row;
      columnChartConfig = {
        configuration: {
          columns: {
            name: 0,
            unfilteredValue: 1,
            filteredValue: 2,
            selected: 3
          },
          interactive: scope.allowFilterChange,
          localization: {
            'NO_VALUE': '({0})'.format(I18n.common.noValue),
            'FLYOUT_UNFILTERED_AMOUNT_LABEL': I18n.flyout.total,
            'FLYOUT_FILTERED_AMOUNT_LABEL': I18n.flyout.filteredAmount,
            'FLYOUT_SELECTED_NOTICE': scope.allowFilterChange ? I18n.flyout.clearFilterLong : ''
          }
        },
        unit: {
          one: initialRowDisplayUnit,
          other: PluralizeService.pluralize(initialRowDisplayUnit)
        }
      };
      columnChart = new socrata.visualizations.ColumnChart(element, columnChartConfig);

      Rx.Observable.subscribeLatest(
        element.closest('.card-visualization').observeDimensions().map(function(dimensions) {
          return {
            width: Math.max(dimensions.width, 0),
            height: Math.max(dimensions.height, 0)
          };
        }),
        cardData$,
        isFiltered$,
        expanded$,
        showAllLabels$,
        rowDisplayUnit$,
        function(cardVisualizationDimensions, cardData, isFiltered, expanded, showAllLabels, rowDisplayUnit) {

          if (!columnChart) {
            return undefined;
          }

          if (!cardData) {
            return undefined;
          }

          rowDisplayUnit = rowDisplayUnit || I18n.common.row;

          scope.$emit('render:start', { source: 'columnChart_{0}'.format(scope.$id), timestamp: _.now() });

          var chartRenderOptions = {
            expanded: expanded,
            unit: {
              one: rowDisplayUnit,
              other: PluralizeService.pluralize(rowDisplayUnit)
            },
            showFiltered: isFiltered,
            showAllLabels: expanded || showAllLabels
          };
          columnChart.render(cardData, chartRenderOptions);

          // Yield execution to the browser to render, then notify that render is complete
          $timeout(function() {
            scope.$emit('render:complete', { source: 'columnChart_{0}'.format(scope.$id), timestamp: _.now() });
          });
        }
      );

      scope.$destroyAsObservable(element).subscribe(function() {
        columnChart.destroy();
      });

      /**
       * Watch events emitted by socrata.visualizations.Column.
       */

      element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', handleVisualizationFlyout);

      function handleVisualizationFlyout(event) {

        var payload = event.originalEvent.detail;

        lastFlyoutData = payload;
      }
    }
  };
});
