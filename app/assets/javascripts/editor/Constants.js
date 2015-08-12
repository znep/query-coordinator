;var Constants = {

  // TODO: Document the payload of each action
  STORY_CREATE: 'STORY_CREATE',
  STORY_SET_DESCRIPTION: 'STORY_SET_DESCRIPTION',
  STORY_SET_TITLE: 'STORY_SET_TITLE',
  STORY_OVERWRITE_STATE: 'STORY_OVERWRITE_STATE',
  STORY_DELETE_BLOCK: 'STORY_DELETE_BLOCK',
  STORY_MOVE_BLOCK_DOWN: 'STORY_MOVE_BLOCK_DOWN',
  STORY_MOVE_BLOCK_UP: 'STORY_MOVE_BLOCK_UP',
  // Expects: action, blockContent, insertAt, storyUid
  STORY_INSERT_BLOCK: 'STORY_INSERT_BLOCK',

  BLOCK_UPDATE_COMPONENT: 'BLOCK_UPDATE_COMPONENT',

  STORY_MOUSE_ENTER: 'STORY_MOUSE_ENTER',
  STORY_MOUSE_LEAVE: 'STORY_MOUSE_LEAVE',

  STORY_DRAG_ENTER: 'STORY_DRAG_ENTER',
  STORY_DRAG_LEAVE: 'STORY_DRAG_LEAVE',
  // Expects: storyUid, blockContent, pointer, storyElement
  STORY_DRAG_OVER: 'STORY_DRAG_OVER',
  STORY_DROP: 'STORY_DROP',

  // Expects: storyUid.
  STORY_SAVE_METADATA: 'STORY_SAVE_METADATA',

  BLOCK_DOUBLE_CLICK: 'BLOCK_DOUBLE_CLICK',
  BLOCK_MOUSE_MOVE: 'BLOCK_MOUSE_MOVE',

  RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS: 'RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS',

  HISTORY_UNDO: 'HISTORY_UNDO',
  HISTORY_REDO: 'HISTORY_REDO',

  // Initial wizard setup
  EMBED_WIZARD_CHOOSE_PROVIDER: 'EMBED_WIZARD_CHOOSE_PROVIDER',
  EMBED_WIZARD_APPLY: 'EMBED_WIZARD_APPLY',
  EMBED_WIZARD_CLOSE: 'EMBED_WIZARD_CLOSE',

  // Youtube embed flow
  EMBED_WIZARD_CHOOSE_YOUTUBE: 'EMBED_WIZARD_CHOOSE_YOUTUBE',
  EMBED_WIZARD_UPDATE_YOUTUBE_URL: 'EMBED_WIZARD_UPDATE_YOUTUBE_URL',

  // Socrata visualization flow
  EMBED_WIZARD_CHOOSE_VISUALIZATION: 'EMBED_WIZARD_CHOOSE_VISUALIZATION',
  // Expects: datasetUid, isNewBackend
  EMBED_WIZARD_CHOOSE_VISUALIZATION_DATASET: 'EMBED_WIZARD_CHOOSE_VISUALIZATION_DATASET',
  // Expects: cardData
  EMBED_WIZARD_UPDATE_VISUALIZATION_CONFIGURATION: 'EMBED_WIZARD_UPDATE_VISUALIZATION_CONFIGURATION',


  // Actual constants
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

  WINDOW_RESIZE_RERENDER_DELAY: 200
};

(function() {
  'use strict';
  var values = _.values(Constants);
  if (values.length !== _.uniq(values).length) {
    throw new Error('Constants contains non-unique values');
  }
})();

