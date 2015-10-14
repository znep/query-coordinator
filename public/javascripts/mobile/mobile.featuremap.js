$(document).ready(function() {

  var scrolling = false;
  var endScrolling;

  $(window).on("scroll", function() {
    scrolling = true;
    endScrolling = window.setTimeout(function() {
      scrolling = false;
      window.clearTimeout(endScrolling);
    }, 100);
  });

  /**
   * Set up the plugin.
   */

  var DOMAIN = 'dataspace.demo.socrata.com';
  var DATASET_UID = 'r6t9-rak2';
  var COLUMN_NAME = 'point';

  var flyoutRenderer = new socrata.visualizations.FlyoutRenderer();
  socrata.visualizations.RowInspector.setup();

  var featureMap1VIF = {
    'aggregation': {
      'columnName': null,
      'function': 'count'
    },
    'columnName': COLUMN_NAME,
    'configuration': {
      // If the value of `datasetMetadata` is falsey then the feature map
      // plugin will make its own request for dataset metadata.
      // If it is truthy then this value will be used instead of making a new
      // request.
      'datasetMetadata': false,
      // Behavior
      'hover': true,
      'panAndZoom': true,
      'locateUser': true,
      'mapOptions': {
        'tap': true,
        'dragging': true,
        'tapTolerance': 15,
        'trackResize': true,
        'maxZoom': 300,
        'zoomControl': false,
      },
      // The localization values should be set by the application but are set to string literals
      // for the purposes of this example.
      'localization': {
        'FLYOUT_FILTER_NOTICE': 'There are too many points at this location',
        'FLYOUT_FILTER_OR_ZOOM_NOTICE': 'Zoom in to see details',
        'FLYOUT_DENSE_DATA_NOTICE': 'Numerous',
        'FLYOUT_CLICK_TO_INSPECT_NOTICE': 'Click to see details',
        'FLYOUT_CLICK_TO_LOCATE_USER_TITLE': 'Click to show your position on the map',
        'FLYOUT_CLICK_TO_LOCATE_USER_NOTICE': 'You may have to give your browser permission to share your current location',
        'FLYOUT_LOCATING_USER_TITLE': 'Your position is being determined',
        'FLYOUT_LOCATE_USER_ERROR_TITLE': 'There was an error determining your location',
        'FLYOUT_LOCATE_USER_ERROR_NOTICE': 'Click to try again',
        'FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE': 'Panning and zooming has been disabled',
        'ROW_INSPECTOR_ROW_DATA_QUERY_FAILED': 'Detailed information about these points cannot be loaded at this time',
        'USER_CURRENT_POSITION': 'Your current location (estimated)'
      },
      // Base layer
      'baseLayerUrl': 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
      'baseLayerOpacity': 0.5,
      'useOriginHost': false
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
    'unit': {
      'one': 'record',
      'other': 'records'
    }
  };

  var $featureMapElement = $('#feature-map');
  $featureMapElement.socrataMobileFeatureMap(featureMap1VIF);

  mapHeight = (60 * $(window).height()) / 100 // Map should be 60% of device height
  $featureMapElement.height(mapHeight)

  /**
   * Handle flyout events.
   * (RowInspector events are handled internally to the RowInspector)
   */

  $featureMapElement.on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', handleFlyout);

  function handleFlyout(event) {

    var payload = event.originalEvent.detail;

    // Render/hide a flyout
    if (payload !== null) {
      flyoutRenderer.render(payload);
    } else {
      flyoutRenderer.clear();
    }
  }
});
