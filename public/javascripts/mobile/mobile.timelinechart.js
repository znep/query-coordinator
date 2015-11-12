var flyoutRenderer = new window.socrata.visualizations.FlyoutRenderer();
var COLUMN_NAME = 'updated';
var DATASET_UID = 'r6t9-rak2';
var DOMAIN = 'dataspace.demo.socrata.com';
var timelineChart1VIF = {
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

var $timelineChart1Element = $('#timeline-chart');
$timelineChart1Element.socrataTimelineChart(timelineChart1VIF);

// Handle flyout events
$timelineChart1Element.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', handleFlyout);

function handleFlyout(event) {
  var payload = event.originalEvent.detail;

  // Render/hide a flyout
  if (payload !== null) {
    flyoutRenderer.render(payload);
  } else {
    flyoutRenderer.clear();
  }
}
