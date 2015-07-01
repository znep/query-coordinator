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
      'COLUMN_ALIAS_GUARD_PREFIX': 'COLUMN_ALIAS_GUARD__',
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
      'TIMELINE_CHART_MARGIN': {
        'TOP': 0,
        'RIGHT': 0,
        'BOTTOM': 30,
        'LEFT': 0
      },
      'TIMELINE_CHART_NUMBER_OF_TICKS': 3,
      'TIMELINE_CHART_TICK_SIZE': 3,
      'TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN': 50,
      'TIMELINE_CHART_GUTTER': 15,
      'TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET': 11,
      'TIMELINE_CHART_DRAG_HANDLE_WIDTH': 24,
      'TIMELINE_CHART_MIN_LABEL_WIDTH': 150,
      'TIMELINE_CHART_REQUIRED_LABEL_WIDTH': 50,

      // Histogram visualization parameters.
      'HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD': 2000,
      'HISTOGRAM_Y_TICK_LABEL_OFFSET': 8,
      'HISTOGRAM_NONZERO_PIXEL_THRESHOLD': 2,
      'HISTOGRAM_CLEAR_X_OFFSET': 2,
      'HISTOGRAM_MARGINS': {
        left: 15,
        right: 15,
        top: 5,
        bottom: 30
      },
      'HISTOGRAM_DRAG_TARGET_WIDTH': 11,
      'HISTOGRAM_HOVER_TARGET_SIZE': 10,
      'HISTOGRAM_HANDLE_HEIGHT': 8,

      // Feature Maps
      'FEATURE_MAP_HOVER_THRESHOLD': 8,
      'FEATURE_MAP_FLYOUT_Y_OFFSET': 5,

      // Table card visualization parameters.
      'TABLE_UNSORTABLE_PHYSICAL_DATATYPES': ['geo_entity', 'point'],

      // SVG Paths
      'FILTER_ICON_SVG_PATH': 'M617.661 322.068l-25.462-309.228h-164.531l-25.467 309.228-317.215 518.712h849.894l-317.22-518.712z',

      // Flyout parameters
      'FLYOUT_WINDOW_PADDING': 22,
      'FLYOUT_BOTTOM_PADDING': 1,
      'FLYOUT_ERROR_THRESHOLD': 2,

      // Related Views
      'RELATED_VIEWS_LIST_HEIGHT_OFFSET': 150,

      // Aggregation Chooser
      'AGGREGATION_MAX_COLUMN_COUNT': 15,

      // This is a filter we use to exclude dates outside the maximum legal date value
      // as a string in Javascript.  We set it to 01/01 so we can still use rollups
      // aggregated at the yearly level if possible.
      // NOTE! Do not include the time in this string or SoQL queries will break!
      'MAX_LEGAL_JAVASCRIPT_DATE_STRING': '9999-01-01',
      'DISABLE_LEAFLET_ZOOM_ANIMATION': false,
      'DEFAULT_SHAPE_FILE_REGION_QUERY_LIMIT': 5000
    };

  }

  angular.
    module('dataCards.services').
      factory('Constants', Constants);

})();
