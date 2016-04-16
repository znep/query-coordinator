export default {
  FOUR_BY_FOUR_PATTERN: /^\w{4}-\w{4}$/,

  // Obtained email regex from Strings.java in core-misc
  VALID_EMAIL_PATTERN: /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i,

  LOGIN_PATH: '/login?return_to=/stories/post_login',

  YOUTUBE_URL_PATTERNS: [
    /youtu\.be\/([^#\&\?]{11})/,  // youtu.be/<id>
    /\?v=([^#\&\?]{11})/,         // ?v=<id>
    /\&v=([^#\&\?]{11})/,         // &v=<id>
    /embed\/([^#\&\?]{11})/,      // embed/<id>
    /\/v\/([^#\&\?]{11})/         // /v/<id>
  ],

  MINIMUM_COMPONENT_HEIGHTS_PX: {
    VISUALIZATION: 200,
    HTMLEMBED: 30
  },

  AUTOSAVE_DEBOUNCE_TIME_IN_SECONDS: 2,

  CHECK_DOCUMENT_PROCESSED_MAX_RETRY_SECONDS: 30,
  CHECK_DOCUMENT_PROCESSED_RETRY_INTERVAL: 1000,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,  // 5 MB

  HISTORY_MAX_UNDO_COUNT: 99,

  SOQL_DATA_PROVIDER_NAME_ALIAS: 'COLUMN_ALIAS_GUARD_NAME',
  SOQL_DATA_PROVIDER_VALUE_ALIAS: 'COLUMN_ALIAS_GUARD_VALUE',

  SOCRATA_VISUALIZATION_DESTROY: 'SOCRATA_VISUALIZATION_DESTROY',

  IMAGE_SEARCH_PAGE_SIZE: 15,

  API_PREFIX_PATH: '/stories/api/v1/',

  // This doesn't set the base font size for the scss
  // and will need to be kept in sync.
  THEME_BASE_FONT_SIZE: '16px',

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

  DEFAULT_VISUALIZATION_HEIGHT: 300,
  DEFAULT_TABLE_HEIGHT: 500,

  SOCRATA_VISUALIZATION_FEATURE_MAP_DEFAULT_BASE_LAYER: 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',

  SAVE_BUTTON_STATE_IDLE: 'idle',
  SAVE_BUTTON_STATE_UNSAVED: 'unsaved',
  SAVE_BUTTON_STATE_SAVING: 'saving',
  SAVE_BUTTON_STATE_SAVED: 'saved',

  RICH_TEXT_FORMATS: [
    { id: 'heading1', tag: 'h1', name: 'Heading 1', dropdown: true },
    { id: 'heading2', tag: 'h2', name: 'Heading 2', dropdown: true },
    { id: 'heading3', tag: 'h3', name: 'Heading 3', dropdown: true },
    { id: 'heading4', tag: 'h4', name: 'Heading 4', dropdown: true },
    { id: 'heading5', tag: 'h5', name: 'Heading 5', dropdown: true },
    { id: 'heading6', tag: 'h6', name: 'Heading 6', dropdown: true },
    { id: 'text', tag: null, name: 'Paragraph', dropdown: true },
    { id: 'bold', tag: 'b', name: 'Bold', dropdown: false, group: 0, panel: false },
    { id: 'italic', tag: 'i', name: 'Italic', dropdown: false, group: 0, panel: false },
    { id: 'textColor', tag: null, name: 'Text Color', dropdown: false, group: 1, panel: true },
    { id: 'left', tag: null, name: 'Align Left', dropdown: false, group: 2, panel: false },
    { id: 'center', tag: null, name: 'Align Center', dropdown: false, group: 2, panel: false },
    { id: 'right', tag: null, name: 'Align Right', dropdown: false, group: 2, panel: false },
    { id: 'orderedList', tag: 'ol', name: 'Ordered List', dropdown: false, group: 3, panel: false },
    { id: 'unorderedList', tag: 'ul', name: 'Unordered List', dropdown: false, group: 3, panel: false },
    { id: 'blockquote', tag: 'blockquote', name: 'Block Quote', dropdown: false, group: 3, panel: false },
    { id: 'link', tag: 'a', name: 'Link', dropdown: false, group: 4, panel: false },
    { id: 'clearFormatting', tag: null, name: 'Clear Formatting', dropdown: false, group: 5, panel: false }
  ]
};
