// Has side effect of registering jQuery plugin.
require('socrata-visualizations').ChoroplethMap;
require('./styles/choropleth-map.scss');
var FlyoutRenderer = require('socrata-visualizations').views.FlyoutRenderer;

module.exports = function(values, $target) {

  /**
   * Render things!
   */

  var flyoutRenderer = new FlyoutRenderer();

  var choroplethVIF = {
    'aggregation': {
      'field': values.aggregationField,
      'function': values.aggregationFunction
    },
    'columnName': values.columnName,
    'configuration': {
      'mapOptions': {
        'tap': false
      },
      'baseLayerUrl': 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
      'baseLayerOpacity': 0.8,
      'computedColumnName': values.computedColumnName,
      'defaultExtent' : values.mapExtent,
      'legend': {
        'type': 'continuous',
        'positiveColor': '#007862',
        'negativeColor': '#CE6565'
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
    'filters': values.filters,
    'format': {
      'type': 'visualization_interchange_format',
      'version': 1
    },
    'title': 'Example Usage: socrata.visualizations.ChoroplethMap.js',
    'type': 'choroplethMap',
    'unit': {
      'one': ' ',
      'other': ' '
    }
  };

  var $choroplethElement1 = $target;
  $choroplethElement1.socrataChoroplethMap(choroplethVIF);

  /**
   * Handle flyout events.
   */

  $choroplethElement1.on('SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT', handleFlyout);

  function handleFlyout(event) {

    var payload = event.originalEvent.detail;

    // Render/hide a flyout
    if (payload !== null) {
      flyoutRenderer.render(payload);

      $(window).one('touchmove', function() {
        flyoutRenderer.clear();
      });
    } else {
      flyoutRenderer.clear();
    }
  }

  function handleFiltersUpdated(event, data) {
    choroplethVIF.filters = data.filters;

    var changeEvent = jQuery.Event('SOCRATA_VISUALIZATION_RENDER_VIF'); // eslint-disable-line
    changeEvent.originalEvent = {
      detail: choroplethVIF
    };

    $choroplethElement1.trigger(changeEvent);
  }

  $(document).on('appliedFilters.qfb.socrata', handleFiltersUpdated);

};
