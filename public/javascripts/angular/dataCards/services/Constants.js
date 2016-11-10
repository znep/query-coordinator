module.exports = function Constants() {

  return {

    // Event constants
    MOUSE_WHEEL_EVENTS: 'mousewheel DOMMouseScroll MozMousePixelScroll',

    // Layout parameters
    LAYOUT_CARD_MARGIN: 5,
    LAYOUT_CARD_GROUP_BOTTOM_SPACING: 24,
    LAYOUT_CARD_GROUP_PADDING: 12,
    LAYOUT_CARD_GROUP_BORDER_WIDTH: 4,
    LAYOUT_HORIZONTAL_PADDING: 12,
    LAYOUT_EDIT_MODE_GROUP_PADDING: 64,
    LAYOUT_DROP_TARGET_HEIGHT: 70,
    LAYOUT_DATA_CARD_HEIGHT: 480,
    LAYOUT_MIN_EXPANDED_CARD_HEIGHT: 480,
    LAYOUT_WINDOW_SIZE_DEBOUNCE: 100,
    LAYOUT_SIDEBAR_WIDTH: 152,
    LAYOUT_HINT_COMPUTED_HEIGHT: 85,

    TRANSITION_DURATION: 0.5,

    // Dataset field names and internal calculated values.
    COLUMN_ALIAS_GUARD_PREFIX: 'COLUMN_ALIAS_GUARD__',
    INTERNAL_DATASET_FEATURE_ID: '_feature_id',
    UNFILTERED_VALUE_PROPERTY_NAME: '__SOCRATA_UNFILTERED_VALUE__',
    FILTERED_VALUE_PROPERTY_NAME: '__SOCRATA_FILTERED_VALUE__',
    SELECTED_PROPERTY_NAME: '__SOCRATA_FEATURE_SELECTED__',
    HUMAN_READABLE_PROPERTY_NAME: '__SOCRATA_HUMAN_READABLE_NAME__',

    // Search card suggestion parameters.
    SUGGESTION_DISABLED_DATA_TYPES: ['number', 'money'],
    MAX_NUMBER_OF_SUGGESTIONS: 10,
    MAX_SUGGESTION_LENGTH: 85,

    // Visualization
    MAPBOX_SIMPLE_GREY_BASE_LAYER_URL: 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
    MAPBOX_SIMPLE_BLUE_BASE_LAYER_URL: 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',
    ESRI_BASE_LAYER_URL: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    TILEURL_REGEX: /^ *https?:\/\/(.*(\{|%7b)[xyz](\}|%7d)){3}/i,
    SIMPLE_GREY_MAP_BASE_LAYER_OPACITY: 0.15,
    DEFAULT_MAP_BASE_LAYER_OPACITY: .42,

    // Column chart visualization parameters.
    COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD: 100,

    // Choropleth visualization parameters.
    CHOROPLETH_SELECTION_BOX_LEFT: 10,
    CHOROPLETH_SELECTION_BOX_RIGHT: 145,
    CHOROPLETH_DEFAULT_WIDTH: 1,
    CHOROPLETH_HIGHLIGHT_WIDTH: 4,
    MAXIMUM_NUMBER_OF_CLASSES_ALLOWED: 7,
    CONTINUOUS_LEGEND_ZERO_COLOR: '#ffffff',
    CONTINUOUS_LEGEND_POSITIVE_COLOR: '#003747',
    CONTINUOUS_LEGEND_NEGATIVE_COLOR: '#c6663d',
    DISCRETE_LEGEND_ZERO_COLOR: '#eeeeee',
    DISCRETE_LEGEND_POSITIVE_COLOR: '#408499',
    DISCRETE_LEGEND_NEGATIVE_COLOR: '#c6663d',

    // Timeline chart visualization parameters.
    TIMELINE_CHART_MARGIN: {
      TOP: 0,
      RIGHT: 0,
      BOTTOM: 30,
      LEFT: 0
    },
    TIMELINE_CHART_NUMBER_OF_TICKS: 3,
    TIMELINE_CHART_TICK_SIZE: 3,
    TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN: 50,
    TIMELINE_CHART_GUTTER: 15,
    TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET: 11,
    TIMELINE_CHART_DRAG_HANDLE_WIDTH: 24,
    TIMELINE_CHART_MIN_LABEL_WIDTH: 150,
    TIMELINE_CHART_REQUIRED_LABEL_WIDTH: 50,

    // Timeline chart and Histogram common visualization parameters
    AXIS_LABEL_SETS: [1, 2, 3, 5, 7, 10], // include every nth label on either side of 0

    // Histogram visualization parameters.
    HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD: 2000,
    HISTOGRAM_Y_TICK_LABEL_OFFSET: 8,
    HISTOGRAM_NONZERO_PIXEL_THRESHOLD: 2,
    HISTOGRAM_TSPAN_OFFSET: 2,
    HISTOGRAM_MARGINS: {
      left: 15,
      right: 15,
      top: 5,
      bottom: 30
    },
    HISTOGRAM_DRAG_TARGET_WIDTH: 11,
    HISTOGRAM_HOVER_TARGET_SIZE: 10,
    HISTOGRAM_HANDLE_HEIGHT: 8,
    HISTOGRAM_REQUIRED_LABEL_WIDTH: 42, // based off of "-1,000" label
    HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD: 20,
    HISTOGRAM_COLUMN_CHART_RANGE_THRESHOLD: 20,

    // Feature Maps
    FEATURE_MAP_MIN_HOVER_THRESHOLD: 5,
    FEATURE_MAP_MAX_ZOOM: 18, // same as Leaflet default
    FEATURE_MAP_TILE_OVERLAP_ZOOM_THRESHOLD: 6,
    FEATURE_MAP_FLYOUT_Y_OFFSET: 1.25,
    FEATURE_MAP_RESIZE_DEBOUNCE_INTERVAL: 250,
    FEATURE_MAP_MAX_TILE_DENSITY: 50000,
    FEATURE_MAP_RENDER_TIMEOUT: 20000,

    // Feature Map Flannel
    FEATURE_MAP_FLANNEL_PADDING_COMPENSATION: 3,
    FEATURE_MAP_FLANNEL_WIDTH: 350,
    FEATURE_MAP_FLANNEL_MAX_CONTENT_HEIGHT: 250,
    FEATURE_MAP_FLANNEL_HINT_WIDTH: 10,
    FEATURE_MAP_FLANNEL_CLOSE_ICON_INITIAL_PADDING: 5,
    FEATURE_MAP_FLANNEL_MAX_ROW_DENSITY: 100,
    FEATURE_MAP_FLANNEL_FIREFOX_SCROLLBAR_PADDING: 12,
    FEATURE_MAP_FLANNEL_QUERY_BOX_PADDING: 1,

    // Feature Map Flannel Query Statuses
    QUERY_PENDING: 'pending',
    QUERY_ERROR: 'error',
    QUERY_SUCCESS: 'success',

    // Table card visualization parameters.
    TABLE_UNSORTABLE_PHYSICAL_DATATYPES: ['geo_entity', 'point'],

    // Icon Font
    FILTER_ICON_UNICODE_GLYPH: '\uf121',
    CLOSE_ICON_UNICODE_GLYPH: '\uf112',

    // Flyout parameters
    FLYOUT_WINDOW_PADDING: 22,
    FLYOUT_BOTTOM_PADDING: 1,
    FLYOUT_TOP_PADDING: 10,
    FLYOUT_ERROR_THRESHOLD: 2,

    // Related Views
    RELATED_VIEWS_LIST_HEIGHT_OFFSET: 150,

    // QFB
    MAX_OPERAND_LENGTH: 85,

    // Card Aggregation Selector
    AGGREGATION_CARDTYPE_BLACKLIST: ['search', 'feature', 'table'],
    FIELD_NAMES_THAT_CANNOT_BE_AGGREGATED: [
      // TODO: Once a "logical" type property is available, this will need to be updated
      'latitude',
      'longitude',
      'lat',
      'lng',
      'long',
      'x',
      'y'
    ],

    // This is a filter we use to exclude dates outside the maximum legal date value
    // as a string in Javascript.  We set it to 01/01 so we can still use rollups
    // aggregated at the yearly level if possible.
    // NOTE! Do not include the time in this string or SoQL queries will break!
    MAX_LEGAL_JAVASCRIPT_DATE_STRING: '9999-01-01',
    DISABLE_LEAFLET_ZOOM_ANIMATION: false,
    DEFAULT_SHAPE_FILE_REGION_QUERY_LIMIT: 5000
  };

};