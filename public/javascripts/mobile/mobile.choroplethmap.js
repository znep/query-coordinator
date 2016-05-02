// Has side effect of registering jQuery plugin.
require('socrata-visualizations').ChoroplethMap;
require('./styles/choropleth-map.scss');
require('./styles/choropleth-map-legend.scss');

import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import MobileChartFlyout from './react-components/mobileFlyout/mobileChartFlyout';

module.exports = function(values, $target) {
  'use strict';

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
    'unit': values.unit
  };

  var $choroplethElement = $target;
  var $choroplethContainer = $target.parent();
  $choroplethElement.socrataChoroplethMap(choroplethVIF);
  $choroplethContainer.append('<div class="mobile-flyout hidden"></div>');

  $choroplethElement.on('SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT', handleFlyout);

  function handleFlyout(event) {

    var payload = event.originalEvent.detail;

    // Render/hide a flyout
    if (payload !== null) {
      $choroplethContainer.toggleClass('expanded', true);
      $choroplethContainer.find('.mobile-flyout').toggleClass('hidden', false);
      $choroplethContainer.find('.choropleth-container').toggleClass('with-flyout-open', true);

      mobileFlyoutRender(payload);

      $(window).one('touchmove', function() {
        clearFlyout();
      });

    } else {
      clearFlyout();
    }
  }

  function clearFlyout() {
    $choroplethContainer.toggleClass('expanded', false);
    $choroplethContainer.find('.choropleth-container').toggleClass('with-flyout-open', false);
    $choroplethContainer.find('.mobile-flyout').toggleClass('hidden', true).empty();
  }

  function handleFiltersUpdated(event, data) {
    choroplethVIF.filters = data.filters;

    var changeEvent = jQuery.Event('SOCRATA_VISUALIZATION_RENDER_VIF'); // eslint-disable-line
    changeEvent.originalEvent = {
      detail: choroplethVIF
    };

    $choroplethElement.trigger(changeEvent);
  }

  $(document).on('appliedFilters.qfb.socrata', handleFiltersUpdated);

  function mobileFlyoutRender(payload) {
    var flyoutContainer = $choroplethContainer.find('.mobile-flyout').empty()[0];
    var arrowMarginLeft = parseFloat(payload.flyoutOffset.left) - 16.5;

    ReactDOM.render(<MobileChartFlyout
      title={ payload.title }
      filteredValue={ payload.filtered !== '(No Value)' ? payload.filtered : false }
      unFilteredValue={ payload.unfiltered == '(No Value)' ? 0 : payload.unfiltered }
      arrowPosition={ arrowMarginLeft }
      unit={ choroplethVIF.unit } />, flyoutContainer);
  }
};
