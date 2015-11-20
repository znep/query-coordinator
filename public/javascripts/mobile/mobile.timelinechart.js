$(function () {
  'use strict';

  var flyoutRenderer = new window.socrata.visualizations.FlyoutRenderer();
  var COLUMN_NAME = 'updated';
  var DATASET_UID = 'r6t9-rak2';
  var DOMAIN = 'dataspace.demo.socrata.com';
  var timelineChartVIF = {
    'aggregation': {
      'columnName': null,
      'function': 'count'
    },
    'columnName': COLUMN_NAME,
    'configuration': {
      'localization': {
        'NO_VALUE': 'No value',
        'FLYOUT_UNFILTERED_AMOUNT_LABEL': 'Total',
        'FLYOUT_FILTERED_AMOUNT_LABEL': 'Filtered',
        'FLYOUT_SELECTED_NOTICE': 'This column is selected'
      },
    },
    'createdAt': '2014-01-01T00:00:00',
    'datasetUid': DATASET_UID,
    'domain': DOMAIN,
    'filters': [],
    'format': {
      'type': 'visualization_interchange_format',
      'version': 1
    },
    'origin': {
      'type': 'test_data',
      'url': 'localhost'
    },
    'title': COLUMN_NAME,
    'type': 'timelineChart',
    'unit': {
      'one': 'case',
      'other': 'cases'
    }
  };

  var $timelineChartElement = $('#timeline-chart');
  var $timelineChartContainer = $('.timeline-chart-container');
  
  $timelineChartElement.socrataTimelineChart(timelineChartVIF);
  $timelineChartContainer.append('<div class="mobile-flyout"></div>');

  // Handle flyout events
  $timelineChartElement.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', handleFlyout);
  $timelineChartElement.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_CLEAR', clearFlyout);

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
      '<div class="arrow" style="left: ' + ((flyoutBounds.left-28) + (highlightedBarWidth/2)) + 'px"></div>' +
      '<h4 class="title pull-left">' + payload.data.title + '</h4>' +
      '<h4 class="value pull-right text-right">' + payload.data.unfilteredValue.split(' ')[0] +
      '<span> ' + payload.data.unfilteredValue.split(' ')[1] + '</span>' +
      '</h4>' +
      '</div>'
    });

    $timelineChartContainer.find('.mobile-flyout').html(flyoutData);
  }
});
