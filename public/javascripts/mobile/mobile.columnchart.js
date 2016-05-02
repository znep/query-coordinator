// Has side effect of registering jQuery plugin.
require('socrata-visualizations').ColumnChart;
require('./styles/column-chart.scss');
var Loader = require('./components/Loader');

import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import MobileChartFlyout from './react-components/mobileFlyout/mobileChartFlyout';

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

  var $columnChartContainer = $target.parent();
  $columnChartContainer.append('<div class="mobile-flyout hidden"></div>');

  var chartWrapper = $columnChartElement.find('.column-chart-wrapper');

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

    $columnChartContainer.find('.mobile-flyout').toggleClass('hidden', false);

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

    var selectedBar = chartWrapper.find('.bar-group[data-bar-name="{0}"]'.format(barName)).addClass('selected');

    if (filteredValue != unFilteredValue) {
      if (parseInt(filteredValue) >= 1000000) {
        filteredValue = (filteredValue / 1000000).toFixed(1) + 'M';
      } else if (parseInt(filteredValue) >= 1000) {
        filteredValue = (filteredValue / 1000).toFixed(1) + 'K';
      }
    } else {
      filteredValue = false;
    }

    if (parseInt(unFilteredValue) >= 1000000) {
      unFilteredValue = (unFilteredValue / 1000000).toFixed(1) + 'M';
    } else if (parseInt(unFilteredValue) >= 1000) {
      unFilteredValue = (unFilteredValue / 1000).toFixed(1) + 'K';
    }

    var flyoutContainer = $columnChartContainer.find('.mobile-flyout').empty()[0];
    var arrowMarginLeft = selectedBar.offset().left  - 8;

    ReactDOM.render(<MobileChartFlyout
      title={ barName }
      filteredValue={ filteredValue }
      unFilteredValue={ unFilteredValue }
      arrowPosition={ arrowMarginLeft }
      unit={ columnChartVIF.unit } />, flyoutContainer);
  }
};
