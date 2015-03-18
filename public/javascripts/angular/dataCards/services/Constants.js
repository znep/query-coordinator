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

      'TRANSITION_DURATION': 0.5,

      // Dataset field names and internal calculated values.
      'INTERNAL_DATASET_FEATURE_ID': '_feature_id',
      'UNFILTERED_VALUE_PROPERTY_NAME': '__SOCRATA_UNFILTERED_VALUE__',
      'FILTERED_VALUE_PROPERTY_NAME': '__SOCRATA_FILTERED_VALUE__',
      'SELECTED_PROPERTY_NAME': '__SOCRATA_FEATURE_SELECTED__',
      'HUMAN_READABLE_PROPERTY_NAME': '__SOCRATA_HUMAN_READABLE_NAME__',

      // Visualization
      'NULL_VALUE_LABEL': '(No Value)',
      'DEFAULT_MAP_BASE_LAYER_URL': 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
      'ESRI_BASE_URL': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      'TILEURL_REGEX': /^ *https?:\/\/(.*(\{|%7b)[xyz](\}|%7d)){3}/i,

      // Column chart visualization parameters.
      'COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD': 100,

      // Choropleth visualization parameters.
      'MAXIMUM_NUMBER_OF_CLASSES_ALLOWED': 7,
      'CLASS_BREAK_THRESHOLD': 6,

      // Timeline chart visualization parameters.
      'TIMELINE_CHART_MARGIN_TOP': 0,
      'TIMELINE_CHART_MARGIN_RIGHT': 0,
      'TIMELINE_CHART_MARGIN_BOTTOM': 30,
      'TIMELINE_CHART_MARGIN_LEFT': 0,
      'TIMELINE_CHART_NUMBER_OF_TICKS': 3,
      'TIMELINE_CHART_TICK_SIZE': 3,
      'TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN': 50,
      'TIMELINE_CHART_GUTTER': 15,
      'TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET': 11,

      // Related Views
      'RELATED_VIEWS_LIST_HEIGHT_OFFSET': 150,

      // This is the maximum legal date value as a string in Javascript
      // NOTE! Do not include the time in this string or SoQL queries will break!
      'MAX_LEGAL_JAVASCRIPT_DATE_STRING': '9999-12-31'
    };

  }

  angular.
    module('dataCards.services').
      factory('Constants', Constants);

})();
