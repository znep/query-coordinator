// Has side effect of registering jQuery plugin.
require('socrata-visualizations').ChoroplethMap;
var FlyoutRenderer = require('socrata-visualizations').views.FlyoutRenderer;

module.exports = function(values, $target) {

  /**
   * Render things!
   */

  var flyoutRenderer = new FlyoutRenderer();

  var choroplethVIF = {
    'aggregation': {
      // TODO: implement this!
    },
    'columnName': values.columnName,
    'configuration': {
      'baseLayerUrl': 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
      'baseLayerOpacity': 0.8,
      'computedColumnName': values.computedColumnName,
      'defaultExtent' : values.map_extent,
      'legend': {
        'type': 'continuous'
      },
      // The localization values should be set by the application but are set to string literals
      // for the purposes of this example.
      'localization': {
        'FLYOUT_SELECTED_NOTICE': 'The page is currently filtered by this value, click to clear it',
        'FLYOUT_UNFILTERED_AMOUNT_LABEL': 'Total',
        'FLYOUT_FILTERED_AMOUNT_LABEL': 'Filtered',
        'NO_VALUE': '(No Value)',
        'CLEAR_FILTER_LABEL': 'Clear filter'
      },
      'savedExtent': {
        'southwest': [41.42625319507272, -88.5662841796875],
        'northeast': [42.24478535602799, -86.9183349609375]
      },
      'shapefile': {
        'columns': {
          'name': '__SOCRATA_HUMAN_READABLE_NAME__',
          'unfiltered': '__SOCRATA_UNFILTERED_VALUE__',
          'filtered': '__SOCRATA_FILTERED_VALUE__',
          'selected': '__SOCRATA_FEATURE_SELECTED__'
        },
        'geometryLabel': 'ward',
        'primaryKey': '_feature_id',
        'uid': values.geojsonUid
      }
    },
    'datasetUid': values.datasetUid,
    'description': 'An example choropleth',
    'domain': values.domain,
    'filters': [],
    'format': {
      'type': 'visualization_interchange_format',
      'version': 1
    },
    'title': 'Example Usage: socrata.visualizations.ChoroplethMap.js',
    'type': 'choropleth',
    'unit': {
      'one': 'crime',
      'other': 'crimes'
    }
  };

  var $choroplethElement1 = $target;
  $choroplethElement1.socrataChoroplethMap(choroplethVIF);

  /**
   * Handle flyout events.
   */

  $choroplethElement1.on('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_EVENT', handleFlyout);

  function handleFlyout(event) {

    var payload = event.originalEvent.detail;

    // Render/hide a flyout
    if (payload !== null) {
      flyoutRenderer.render(payload);
    } else {
      flyoutRenderer.clear();
    }
  }

  /**
   * Destroy the plugin.
   *
   * The plugin (and all internal modules) can be destroyed by calling
   * `.destroySocrataChoroplethMap()` on the element.
   */

  // $choroplethElement1.off('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_EVENT', handleFlyout);
  // $choroplethElement1.destroySocrataChoroplethMap();

  // $choroplethElement2.off('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_EVENT', handleFlyout);
  // $choroplethElement2.destroySocrataChoroplethMap();

};
