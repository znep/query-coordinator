var Constants = {

  // Action names

  // {object} data: Story data object.
  STORY_CREATE: 'STORY_CREATE',

  // {string} storyUid
  // {string} description
  STORY_SET_DESCRIPTION: 'STORY_SET_DESCRIPTION',

  // {string} storyUid
  // {string} title
  STORY_SET_TITLE: 'STORY_SET_TITLE',

  // {object} data: Story data object.
  STORY_OVERWRITE_STATE: 'STORY_OVERWRITE_STATE',

  // {string} storyUid
  // {string} blockId
  STORY_DELETE_BLOCK: 'STORY_DELETE_BLOCK',

  // {string} storyUid
  // {string} blockId
  STORY_MOVE_BLOCK_DOWN: 'STORY_MOVE_BLOCK_DOWN',

  // {string} storyUid
  // {string} blockId
  STORY_MOVE_BLOCK_UP: 'STORY_MOVE_BLOCK_UP',

  // {string} storyUid
  // {number} insertAt: Index in block list to insert block.
  // {object} blockContent: Object describing components in block.
  STORY_INSERT_BLOCK: 'STORY_INSERT_BLOCK',

  // {string} blockId
  // {number|string} componentIndex
  // {string} type: New component type.
  // {any} value: New component value.
  BLOCK_UPDATE_COMPONENT: 'BLOCK_UPDATE_COMPONENT',

  // {string} storyUid
  STORY_DRAG_ENTER: 'STORY_DRAG_ENTER',

  // {string} storyUid
  STORY_DRAG_LEAVE: 'STORY_DRAG_LEAVE',

  // {string} storyUid
  // {object} blockContent: Data of block being dragged over story.
  // {object} pointer: Pointer event that triggered this action.
  // {HTMLElement} storyElement: Root of story DOM being dragged over.
  STORY_DRAG_OVER: 'STORY_DRAG_OVER',

  // {string} storyUid
  // {object} blockContent: Data of block being dragged over story.
  STORY_DROP: 'STORY_DROP',

  // {string} storyUid
  STORY_SAVE_METADATA: 'STORY_SAVE_METADATA',

  // {string} storyUid
  // {string} themeId
  STORY_UPDATE_THEME: 'STORY_UPDATE_THEME',

  // {string} storyUid
  // {string} blockId
  BLOCK_DOUBLE_CLICK: 'BLOCK_DOUBLE_CLICK',

  // {array[string]} activeFormats: Currently available formatters.
  RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS: 'RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS',

  // {string} storyUid
  HISTORY_UNDO: 'HISTORY_UNDO',

  // {string} storyUid
  HISTORY_REDO: 'HISTORY_REDO',

  // Initial media selector setup
  // {string} blockId
  // {number} componentIndex
  ASSET_SELECTOR_CHOOSE_PROVIDER: 'ASSET_SELECTOR_CHOOSE_PROVIDER',

  // No payload
  ASSET_SELECTOR_APPLY: 'ASSET_SELECTOR_APPLY',

  // No payload
  ASSET_SELECTOR_CLOSE: 'ASSET_SELECTOR_CLOSE',

  // YouTube embed flow

  // No payload
  ASSET_SELECTOR_CHOOSE_YOUTUBE: 'ASSET_SELECTOR_CHOOSE_YOUTUBE',

  // {string} url
  ASSET_SELECTOR_UPDATE_YOUTUBE_URL: 'ASSET_SELECTOR_UPDATE_YOUTUBE_URL',

  // Socrata visualization flow

  // No payload
  ASSET_SELECTOR_CHOOSE_VISUALIZATION: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION',

  // {string} datasetUid
  // {boolean} isNewBackend
  ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET',

  // {object} cardData
  ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION: 'ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION',

  // No payload
  ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD: 'ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD',

  // {number} percentLoaded
  FILE_UPLOAD_PROGRESS: 'FILE_UPLOAD_PROGRESS',

  // No payload
  FILE_UPLOAD_DONE: 'FILE_UPLOAD_DONE',

  // {object} error
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',

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

