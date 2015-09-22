var Constants = {

  // Configuration
  YOUTUBE_URL_PATTERNS: [
    /youtu\.be\/([^#\&\?]{11})/,  // youtu.be/<id>
    /\?v=([^#\&\?]{11})/,         // ?v=<id>
    /\&v=([^#\&\?]{11})/,         // &v=<id>
    /embed\/([^#\&\?]{11})/,      // embed/<id>
    /\/v\/([^#\&\?]{11})/         // /v/<id>
  ],

  // No payload
  ASSET_SELECTOR_CHOOSE_EMBED_CODE: 'ASSET_SELECTOR_CHOOSE_EMBED_CODE',

  // {string} html
  ASSET_SELECTOR_UPDATE_EMBED_CODE: 'ASSET_SELECTOR_UPDATE_EMBED_CODE',

  // milliseconds
  EMBED_CODE_DEBOUNCE_DELAY: 1000,

  // {number} percentLoaded
  EMBED_CODE_UPLOAD_PROGRESS: 'EMBED_CODE_UPLOAD_PROGRESS',

  // No payload
  EMBED_CODE_UPLOAD_ERROR: 'EMBED_CODE_UPLOAD_ERROR',
  EMBED_CODE_UPLOAD_DONE: 'EMBED_CODE_UPLOAD_DONE',

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
  WINDOW_SIZE_BREAK_MEDIUM: 768
};

(function() {
  'use strict';
  var values = _.values(Constants);
  if (values.length !== _.uniq(values).length) {
    throw new Error('Constants contains non-unique values');
  }
})();

