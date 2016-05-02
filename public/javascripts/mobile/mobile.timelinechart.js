// Has side effect of registering jQuery plugin.
require('./styles/timeline-chart.scss');
require('socrata-visualizations').TimelineChart;
var Loader = require('./components/Loader');

import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import MobileChartFlyout from './react-components/mobileFlyout/mobileChartFlyout';

module.exports = function(values, $target) {
  'use strict';

  var timelineChartVIF = {
    'aggregation': {
      'field': values.aggregationField,
      'function': values.aggregationFunction
    },
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
    'type': 'timelineChart',
    'unit': {
      'one': 'row',
      'other': 'rows'
    }
  };

  var timelineLoader = new Loader($target);
  var $timelineChartElement = $target;
  var $timelineChartContainer = $target.parent();

  $timelineChartElement.socrataTimelineChart(timelineChartVIF);
  $timelineChartContainer.append('<div class="mobile-flyout"></div>');
  $timelineChartContainer.append('<div class="mobile-flyout-dot"></div>');

  // Loader events for timelineChart
  $timelineChartElement.on('SOCRATA_VISUALIZATION_DATA_LOAD_START', function() {
    timelineLoader.showLoader();
  });

  $timelineChartElement.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE', function() {
    timelineLoader.hideLoader();
  });

  // Handle flyout events
  $timelineChartElement.on('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', handleFlyout);
  $timelineChartElement.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_CLEAR', clearFlyout);

  $(document).on('appliedFilters.qfb.socrata', handleVifUpdated);

  function handleVifUpdated(event, data) {
    timelineChartVIF.filters = data.filters;

    var payload = timelineChartVIF;
    var renderVifEvent = jQuery.Event('SOCRATA_VISUALIZATION_RENDER_VIF'); // eslint-disable-line

    renderVifEvent.originalEvent = {
      detail: payload
    };

    $timelineChartElement.trigger(renderVifEvent);
  }

  function clearFlyout() {
    $timelineChartContainer.toggleClass('expanded', false);
    $timelineChartContainer.find('.mobile-flyout, .mobile-flyout-dot').
      toggleClass('hidden', true).empty();
  }

  function handleFlyout(event) {
    var payload = event.originalEvent.detail;

    // Render mobile flyout
    if (payload !== null) {
      mobileFlyoutRender(payload);
      $timelineChartContainer.toggleClass('expanded', true);
      $timelineChartContainer.find('.mobile-flyout, .mobile-flyout-dot').
        toggleClass('hidden', false);
    }
  }

  function mobileFlyoutRender(payload) {
    var flyoutPosition = payload.flyoutPosition;
    var flyoutBounds = payload.element.getBoundingClientRect();
    var highlightedBarWidth = $timelineChartElement.find('.timeline-chart-highlight-container').width();
    var flyoutContainer = $timelineChartContainer.find('.mobile-flyout').empty()[0];
    var arrowMarginLeft = parseFloat((flyoutBounds.left - 12) + (highlightedBarWidth / 2)) - 16.5;

    var filteredValue = payload.filteredValue ? payload.filteredValue.split(' ')[0] : false;
    var unFilteredValue = payload.unfilteredValue.split(' ')[0];

    var dotLeft = ((flyoutBounds.left - 15) + (highlightedBarWidth / 2));
    var dotTop = flyoutPosition.vertical +
      $timelineChartElement.parent().find('.intro-text').height() +
      parseInt($('.timeline-chart-upper-container').css('border-width')) + 5;

    $timelineChartContainer.
      find('.mobile-flyout-dot').
      html('<div class="dot" style="left: {0}px; top: {1}px;"></div>'.format(dotLeft, dotTop));

    ReactDOM.render(<MobileChartFlyout
      title={ payload.title }
      filteredValue={ filteredValue }
      unFilteredValue={ unFilteredValue }
      arrowPosition={ arrowMarginLeft }
      unit={ timelineChartVIF.unit } />, flyoutContainer);
  }
};
