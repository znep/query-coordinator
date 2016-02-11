socrata.visualizations.mobileColumnChart = function(values, $target) {
  'use strict';

  var NAME_INDEX = 0;
  var UNFILTERED_INDEX = 1;
  var FILTERED_INDEX = 2;
  var SELECTED_INDEX = 3;

  var columnChartVIF = {
    aggregation: {
      'columnName': null,
      'function': 'count'
    },
    labelUnit: 'rows',
    showAllLabels: false,
    showFiltered: true,
    'columnName': values.columnName,
    'configuration': {
      'localization': {
        'NO_VALUE': 'No value',
        'FLYOUT_UNFILTERED_AMOUNT_LABEL': 'Total',
        'FLYOUT_FILTERED_AMOUNT_LABEL': 'Filtered',
        'FLYOUT_SELECTED_NOTICE': 'This column is selected'
      }
    },
    'createdAt': '2014-01-01T00:00:00',
    'datasetUid': values.datasetUid,
    'domain': values.domain,
    'filters': [],
    'format': {
      'type': 'visualization_interchange_format',
      'version': 1
    },
    'origin': {
      'type': 'test_data',
      'url': 'localhost'
    },
    'title': values.columnName,
    'type': 'columnChart',
    'unit': {
      'one': 'case',
      'other': 'cases'
    }
  };

  var $columnChartElement = $target;
  $columnChartElement.socrataColumnChart(columnChartVIF);

  var chartWrapper = $columnChartElement.find('.column-chart-wrapper');
  var labelWrapper = $('<div>', {
    'class': 'labels mobile'
  });

  $columnChartElement.append(labelWrapper);

  $columnChartElement.on(
    'click',
    '.bar-group, .labels .label .contents span',
    selectDatum
  );

  var chartWidth = $columnChartElement.find('.bar-group').length * 50;
  $columnChartElement.addClass('responsive');
  $columnChartElement.find('.chart-scroll').width(chartWidth);

  function selectDatum(event) {
    chartWrapper.find('.bar-group').removeClass('selected');
    $columnChartElement.selectedData = {
      name: d3.select(event.currentTarget).datum()[NAME_INDEX],
      unfilteredValue: d3.select(event.currentTarget).datum()[UNFILTERED_INDEX],
      filteredValue: d3.select(event.currentTarget).datum()[FILTERED_INDEX],
      selected: d3.select(event.currentTarget).datum()[SELECTED_INDEX]
    };
    selectBar(event);
  }

  function selectBar(event) {
    var barName = event.currentTarget.getAttribute('data-bar-name');
    var filteredValue = $columnChartElement.selectedData.filteredValue;
    var labelUnit = columnChartVIF.unit.other;

    if ($columnChartElement.selectedData.filteredValue === 1) {
      labelUnit = columnChartVIF.unit.one;
    }

    if (filteredValue > 999) {
      filteredValue = (filteredValue / 1000).toFixed(1) + 'K';
    }

    chartWrapper.
    find('.bar-group[data-bar-name="{0}"]'.format(barName)).
    addClass('selected');

    var titles = $('<div>', {
      'class': 'title-wrapper',
      css: {
        width: $columnChartElement.width()
      },
      html:
      '<div class="labels mobile">' +
      '<h4 class="title pull-left">' + $columnChartElement.selectedData.name + '</h4>' +
      '<h4 class="value pull-right text-right">' + filteredValue +
      '<span> ' + labelUnit + '</span>' +
      '</h4>' +
      '</div>'
    });

    labelWrapper.html(titles);
  }
};
