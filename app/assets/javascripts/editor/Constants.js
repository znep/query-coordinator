(function(root) {
  'use strict';

  var Constants = {
    // Configuration
    YOUTUBE_URL_PATTERNS: [
      /youtu\.be\/([^#\&\?]{11})/,  // youtu.be/<id>
      /\?v=([^#\&\?]{11})/,         // ?v=<id>
      /\&v=([^#\&\?]{11})/,         // &v=<id>
      /embed\/([^#\&\?]{11})/,      // embed/<id>
      /\/v\/([^#\&\?]{11})/         // /v/<id>
    ],

    HISTORY_MAX_UNDO_COUNT: 99,

    SOQL_DATA_PROVIDER_NAME_ALIAS: 'COLUMN_ALIAS_GUARD_NAME',
    SOQL_DATA_PROVIDER_VALUE_ALIAS: 'COLUMN_ALIAS_GUARD_VALUE',

    SOCRATA_VISUALIZATION_DESTROY: 'SOCRATA_VISUALIZATION_DESTROY',

    API_PREFIX_PATH: '/stories/api/v1/',

    // The `name` column of the `lenses` table is defined as:
    //
    //   name character varying(255)
    //
    // Here 255 is the maxiumum allowed length, not the maxiumum character
    // count.
    CORE_VIEW_NAME_MAX_LENGTH: 254,

    WINDOW_RESIZE_RERENDER_DELAY: 200,

    // Breakpoints for Window Width
    WINDOW_SIZE_BREAK_LARGE: 1200,
    WINDOW_SIZE_BREAK_MEDIUM: 768,

    // How long to wait after user input has stopped before uploading the
    // embed code fragment to the backend for storage and subsequent preview
    // (in milliseconds)
    EMBED_CODE_DEBOUNCE_DELAY: 1000,

    DEFAULT_VISUALIZATION_HEIGHT: 300
  };

  root.Constants = Constants;
})(window);
