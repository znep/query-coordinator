(function() {
  'use strict';

  function Constants() {

    return {
      // Layout parameters
      'LAYOUT_HORIZONTAL_PADDING': 5,
      'LAYOUT_VERTICAL_PADDING': 5,
      'LAYOUT_GUTTER': 12,
      'LAYOUT_EDIT_MODE_GROUP_PADDING': 64,
      'LAYOUT_PLACEHOLDER_DROP_TARGET_HEIGHT': 128,
      'LAYOUT_DATA_CARD_HEIGHT': 480,
      'LAYOUT_MIN_EXPANDED_CARD_HEIGHT': 480,

      // Dataset field names and internal calculated values.
      'INTERNAL_DATASET_FEATURE_ID': '_feature_id',
      'UNFILTERED_VALUE_PROPERTY_NAME': '__SOCRATA_UNFILTERED_VALUE__',
      'FILTERED_VALUE_PROPERTY_NAME': '__SOCRATA_FILTERED_VALUE__',
      'SELECTED_PROPERTY_NAME': '__SOCRATA_FEATURE_SELECTED__',
      'HUMAN_READABLE_PROPERTY_NAME': '__SOCRATA_HUMAN_READABLE_NAME__',

      // Visualization
      'NULL_VALUE_LABEL': '(No Value)',
      'DEFAULT_MAP_BASE_LAYER_URL': 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',

      // Choropleth visualization parameters.
      'MAXIMUM_NUMBER_OF_CLASSES_ALLOWED': 7,
      'CLASS_BREAK_THRESHOLD': 6
    };

  }

  angular.
    module('dataCards.services').
      factory('Constants', Constants);

})();
