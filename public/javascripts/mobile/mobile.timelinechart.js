/* global Loader */

// Has side effect of registering jQuery plugin.
require('socrata-visualizations').TimelineChart;

module.exports = function(values, $target) {
  'use strict';

  var timelineChartVIF = {
    'aggregation': {
      'columnName': null,
      'function': 'count'
    },
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
    'type': 'timelineChart',
    'unit': {
      'one': 'case',
      'other': 'cases'
    }
  };

  var timelineLoader = new Loader($target);
  var $timelineChartElement = $target;
  var $timelineChartContainer = $('.timeline-chart-container');

  $timelineChartElement.socrataTimelineChart(timelineChartVIF);
  $timelineChartContainer.append('<div class="mobile-flyout"></div>');

  // Loader events for timelineChart
  $timelineChartElement.on('SOCRATA_VISUALIZATION_DATA_LOAD_START', function() {
    timelineLoader.showLoader();
  });

  $timelineChartElement.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE', function() {
    timelineLoader.hideLoader();
  });

  // Handle flyout events
  $timelineChartElement.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', handleFlyout);
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
    $timelineChartElement.removeClass('expanded');
    $timelineChartContainer.find('.mobile-flyout').html('');
  }

  function handleFlyout(event) {
    var payload = event.originalEvent.detail;

    // Render mobile flyout
    if (payload !== null) {
      mobileFlyoutRender(payload);
      $timelineChartElement.addClass('expanded');
    }
  }

  function mobileFlyoutRender(payload) {
    var flyoutBounds = payload.element.getBoundingClientRect();
    var highlightedBarWidth = $('.timeline-chart-highlight-container').width();
    var flyoutData = $('<div>', {
      'class': 'title-wrapper',
      html:
      '<div class="labels mobile">' +
      '<div class="arrow" style="left: ' + ((flyoutBounds.left - 28) + (highlightedBarWidth / 2)) + 'px"></div>' +
      '<h4 class="title pull-left">' + payload.data.title + '</h4>' +
      '<h4 class="value pull-right text-right">' + payload.data.unfilteredValue.split(' ')[0] +
      '<span> ' + payload.data.unfilteredValue.split(' ')[1] + '</span>' +
      '</h4>' +
      '</div>'
    });

    $timelineChartContainer.find('.mobile-flyout').html(flyoutData);
  }
};
