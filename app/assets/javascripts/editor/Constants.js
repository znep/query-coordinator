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

    RICH_TEXT_FORMATS: [
      { id: 'heading1', tag: 'h1', name: 'Heading 1', dropdown: true },
      { id: 'heading2', tag: 'h2', name: 'Heading 2', dropdown: true },
      { id: 'heading3', tag: 'h3', name: 'Heading 3', dropdown: true },
      { id: 'heading4', tag: 'h4', name: 'Heading 4', dropdown: true },
      { id: 'heading5', tag: 'h5', name: 'Heading 5', dropdown: true },
      { id: 'heading6', tag: 'h6', name: 'Heading 6', dropdown: true },
      { id: 'text', tag: null, name: 'Paragraph', dropdown: true },
      { id: 'bold', tag: 'b', name: 'Bold', dropdown: false, group: 0 },
      { id: 'italic', tag: 'i', name: 'Italic', dropdown: false, group: 0 },
      { id: 'left', tag: null, name: 'Align Left', dropdown: false, group: 1 },
      { id: 'center', tag: null, name: 'Align Center', dropdown: false, group: 1 },
      { id: 'right', tag: null, name: 'Align Right', dropdown: false, group: 1 },
      { id: 'orderedList', tag: 'ol', name: 'Ordered List', dropdown: false, group: 2 },
      { id: 'unorderedList', tag: 'ul', name: 'Unordered List', dropdown: false, group: 2 },
      { id: 'blockquote', tag: 'blockquote', name: 'Block Quote', dropdown: false, group: 2 },
      { id: 'link', tag: 'a', name: 'Link', dropdown: false, group: 3 },
      { id: 'clearFormatting', tag: null, name: 'Clear Formatting', dropdown: false, group: 4 }
    ],

    HISTORY_MAX_UNDO_COUNT: 99,

    SOQL_DATA_PROVIDER_NAME_ALIAS: 'COLUMN_ALIAS_GUARD_NAME',
    SOQL_DATA_PROVIDER_VALUE_ALIAS: 'COLUMN_ALIAS_GUARD_VALUE',

    SOCRATA_VISUALIZATION_DESTROY: 'SOCRATA_VISUALIZATION_DESTROY',

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

    SOCRATA_VISUALIZATION_FEATURE_MAP_DEFAULT_BASE_LAYER: 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',

    SAVE_BUTTON_STATE_IDLE: 'idle',
    SAVE_BUTTON_STATE_UNSAVED: 'unsaved',
    SAVE_BUTTON_STATE_SAVING: 'saving',
    SAVE_BUTTON_STATE_SAVED: 'saved'
  };

  root.Constants = Constants;
})(window);
