// Has side effect of registering jQuery plugin.
require('socrata-visualizations').ColumnChart;
require('./styles/column-chart.scss');
var Loader = require('./components/Loader');

module.exports = function(values, $target) {
  'use strict';

  var NAME_INDEX = 0;
  var UNFILTERED_INDEX = 1;
  var FILTERED_INDEX = 2;
  var SELECTED_INDEX = 3;

  var columnChartVIF = {
    aggregation: {
      'field': values.aggregationField,
      'function': values.aggregationFunction
    },
    labelUnit: 'rows',
    showAllLabels: false,
    showFiltered: true,
    'columnName': values.columnName,
    'configuration': {
      'isMobile': true,
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
    'filters': values.filters,
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
      'one': ' ',
      'other': ' '
    }
  };

  var columnChartLoader = new Loader($target);

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

  // Loader events for timelineChart
  $columnChartElement.on('SOCRATA_VISUALIZATION_DATA_LOAD_START', function() {
    columnChartLoader.showLoader();
  });

  $columnChartElement.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE', function() {
    columnChartLoader.hideLoader();
  });

  $(document).on('appliedFilters.qfb.socrata', handleVifUpdated);

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

  function handleVifUpdated(event, data) {
    columnChartVIF.filters = data.filters;

    var payload = columnChartVIF;
    var renderVifEvent = jQuery.Event('SOCRATA_VISUALIZATION_RENDER_VIF'); // eslint-disable-line

    renderVifEvent.originalEvent = {
      detail: payload
    };

    $columnChartElement.trigger(renderVifEvent);
  }

  function selectBar(event) {
    var barName = event.currentTarget.getAttribute('data-bar-name');
    var unFilteredValue = $columnChartElement.selectedData.unfilteredValue;
    var filteredValue = $columnChartElement.selectedData.filteredValue;
    var labelUnit = columnChartVIF.unit.other;
    var filteredLabelLine = '';
    var valuesStyleClass = 'unfiltered';
    var isFiltered = filteredValue != unFilteredValue;

    if ($columnChartElement.selectedData.filteredValue === 1) {
      labelUnit = columnChartVIF.unit.one;
    }

    chartWrapper.
    find('.bar-group[data-bar-name="{0}"]'.format(barName)).
    addClass('selected');

    if (unFilteredValue > 999999) {
      unFilteredValue = (unFilteredValue / 1000000).toFixed(1) + 'M';
    } else if (filteredValue > 999) {
      unFilteredValue = (unFilteredValue / 1000).toFixed(1) + 'K';
    }

    if (filteredValue > 999999) {
      filteredValue = (filteredValue / 1000000).toFixed(1) + 'M';
    } else if (filteredValue > 999) {
      filteredValue = (filteredValue / 1000).toFixed(1) + 'K';
    }

    if (isFiltered) {
      filteredLabelLine = '<div class="text-right filtered-values"><span>Filtered</span> ' + filteredValue + '</div>';
      valuesStyleClass = 'filtered';
    }

    var unFilteredLabelLine = '<div class="text-right total-values"><span>Total</span> ' + unFilteredValue + '</div>';

    var flyoutData = $('<div>', {
      'class': 'title-wrapper',
      html:
      '<div class="mobile-flyout labels mobile">' +
        '<h4 class="title pull-left">' + $columnChartElement.selectedData.name + '</h4>' +
        '<div class="values pull-right text-right ' + valuesStyleClass + '">' + filteredLabelLine + unFilteredLabelLine + '</div>' +
      '</div>'
    });

    labelWrapper.html(flyoutData);
  }
};
