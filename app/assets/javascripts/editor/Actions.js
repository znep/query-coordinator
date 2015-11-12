(function(root) {
  'use strict';

  var Actions = {

    /**
     * Story state management
     */

    // {object} data: Story data object.
    STORY_CREATE: 'STORY_CREATE',

    // {string} storyUid
    // {string} description
    STORY_SET_DESCRIPTION: 'STORY_SET_DESCRIPTION',

    // {string} storyUid
    // {string} title
    STORY_SET_TITLE: 'STORY_SET_TITLE',

    // {string} storyUid
    // {string} theme
    STORY_UPDATE_THEME: 'STORY_UPDATE_THEME',

    // {object} publishedStory
    STORY_SET_PUBLISHED_STORY: 'STORY_SET_PUBLISHED_STORY',

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

    /**
     * Story save
     */

    // {string} storyUid
    STORY_SAVE_STARTED: 'STORY_SAVE_STARTED',

    // {string} storyUid
    // {string} digest
    STORY_SAVED: 'STORY_SAVED',

    // {string} storyUid
    // {string} message
    STORY_SAVE_FAILED: 'STORY_SAVE_FAILED',

    /**
     * Story metadata and permissions save
     */

    // {string} storyUid
    STORY_SAVE_METADATA: 'STORY_SAVE_METADATA',

    // {boolean} isPublic
    STORY_SET_PERMISSIONS: 'STORY_SET_PERMISSIONS',

    /**
     * Drag drop and double-click-to-add-block actions
     */

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
    // {string} blockId
    BLOCK_DOUBLE_CLICK: 'BLOCK_DOUBLE_CLICK',

    /**
     * Rich text editor -> rich text editor toolbar communication
     */

    // {array[string]} activeFormats: Currently available formatters.
    RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS: 'RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS',

    /**
     * History management
     */

    // {string} storyUid
    HISTORY_UNDO: 'HISTORY_UNDO',

    // {string} storyUid
    HISTORY_REDO: 'HISTORY_REDO',

    /**
     * Generic asset selector flow
     */

    // Select an asset for the first time.
    // {string} blockId
    // {number} componentIndex
    ASSET_SELECTOR_SELECT_NEW: 'ASSET_SELECTOR_SELECT_NEW',

    // Edit an existing asset.
    // {string} blockId
    // {number} componentIndex
    ASSET_SELECTOR_EDIT_EXISTING: 'ASSET_SELECTOR_EDIT_EXISTING',

    // Initial media selector setup
    // {string} blockId
    // {number} componentIndex
    ASSET_SELECTOR_CHOOSE_PROVIDER: 'ASSET_SELECTOR_CHOOSE_PROVIDER',

    // No payload
    ASSET_SELECTOR_APPLY: 'ASSET_SELECTOR_APPLY',

    // No payload
    ASSET_SELECTOR_CLOSE: 'ASSET_SELECTOR_CLOSE',

    /**
     * YouTube embed flow
     */

    // No payload
    ASSET_SELECTOR_CHOOSE_YOUTUBE: 'ASSET_SELECTOR_CHOOSE_YOUTUBE',

    // {string} url
    ASSET_SELECTOR_UPDATE_YOUTUBE_URL: 'ASSET_SELECTOR_UPDATE_YOUTUBE_URL',

    /**
     * Socrata visualization flow
     */

    // No payload
    ASSET_SELECTOR_CHOOSE_VISUALIZATION: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION',

    // {string} datasetUid
    // {boolean} isNewBackend
    ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET',

    // {object} cardData
    ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION: 'ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION',

    /**
     * Image embed flow
     */

    // No payload
    ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD: 'ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD',

    // {number} percentLoaded
    FILE_UPLOAD_PROGRESS: 'FILE_UPLOAD_PROGRESS',

    // No payload
    FILE_UPLOAD_DONE: 'FILE_UPLOAD_DONE',

    // {object} error
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',

    /**
     * Code embed flow
     */

    // No payload
    ASSET_SELECTOR_CHOOSE_EMBED_CODE: 'ASSET_SELECTOR_CHOOSE_EMBED_CODE',

    // {string} html
    ASSET_SELECTOR_UPDATE_EMBED_CODE: 'ASSET_SELECTOR_UPDATE_EMBED_CODE',

    // {number} percentLoaded
    EMBED_CODE_UPLOAD_PROGRESS: 'EMBED_CODE_UPLOAD_PROGRESS',

    // No payload
    EMBED_CODE_UPLOAD_DONE: 'EMBED_CODE_UPLOAD_DONE',

    // No payload
    EMBED_CODE_UPLOAD_ERROR: 'EMBED_CODE_UPLOAD_ERROR'
  };

  root.Actions = Actions;
})(window);
