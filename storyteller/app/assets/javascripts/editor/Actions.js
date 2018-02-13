export default {
  // {Object} data: Story data Object.
  STORY_CREATE: 'STORY_CREATE',

  // {String} updatedAt: the updatedAt field from a draft story
  // {String} storyUid
  STORY_UPDATED: 'STORY_UPDATED',

  // {String} storyUid
  // {String} description
  STORY_SET_DESCRIPTION: 'STORY_SET_DESCRIPTION',

  // {String} storyUid
  // {String} title
  STORY_SET_TITLE: 'STORY_SET_TITLE',

  // {String} storyUid
  // {Object} tile
  STORY_SET_TILE_CONFIG: 'STORY_SET_TILE_CONFIG',

  // {String} storyUid
  // {String} theme
  STORY_UPDATE_THEME: 'STORY_UPDATE_THEME',

  // {String} storyUid
  // {Object} publishedStory
  STORY_SET_PUBLISHED_STORY: 'STORY_SET_PUBLISHED_STORY',

  // {String} storyUid
  // {String} blockId
  STORY_DELETE_BLOCK: 'STORY_DELETE_BLOCK',

  // {String} storyUid
  // {String} blockId
  STORY_MOVE_BLOCK_DOWN: 'STORY_MOVE_BLOCK_DOWN',

  // {String} storyUid
  // {String} blockId
  STORY_MOVE_BLOCK_UP: 'STORY_MOVE_BLOCK_UP',

  // {String} storyUid
  // {String} blockId
  STORY_TOGGLE_BLOCK_PRESENTATION_VISIBILITY: 'STORY_TOGGLE_BLOCK_PRESENTATION_VISIBILITY',

  // {String} storyUid
  // {number} insertAt: Index in block list to insert block.
  // {Object} blockContent: Object describing components in block.
  STORY_INSERT_BLOCK: 'STORY_INSERT_BLOCK',

  // {String} blockId
  // {number|String} componentIndex
  // {String} type: New component type.
  // {any} value: New component value.
  BLOCK_UPDATE_COMPONENT: 'BLOCK_UPDATE_COMPONENT',

  // {String} blockId
  // {number|String} componentIndex
  DISMISS_MAP_NOTIFICATION: 'DISMISS_MAP_NOTIFICATION',

  /**
   * Story save
   */

  // {String} storyUid
  STORY_SAVE_STARTED: 'STORY_SAVE_STARTED',

  // {String} storyUid
  // {String} digest
  STORY_SAVED: 'STORY_SAVED',

  // {String} storyUid
  // {String} message
  STORY_SAVE_FAILED: 'STORY_SAVE_FAILED',

  /**
   * Story metadata and permissions save
   */

  // {String} storyUid
  STORY_SAVE_METADATA: 'STORY_SAVE_METADATA',

  // {boolean} isPublic
  STORY_SET_PERMISSIONS: 'STORY_SET_PERMISSIONS',

  /**
   * Drag drop and double-click-to-add-block actions
   */

  // {String} storyUid
  STORY_DRAG_LEAVE: 'STORY_DRAG_LEAVE',

  // {String} storyUid
  // {Object} blockContent: Data of block being dragged over story.
  // {Object} pointer: Pointer event that triggered this action.
  // {HTMLElement} storyElement: Root of story DOM being dragged over.
  STORY_DRAG_OVER: 'STORY_DRAG_OVER',

  // {String} storyUid
  STORY_DROP: 'STORY_DROP',

  // {String} storyUid
  // {String} blockId
  BLOCK_DOUBLE_CLICK: 'BLOCK_DOUBLE_CLICK',

  /**
   * Rich text editor -> rich text editor toolbar communication
   */

  // {array[String]} activeFormats: Currently available formatters.
  RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS: 'RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS',

  // {String} activeColor
  RTE_TOOLBAR_SET_ACTIVE_COLOR: 'RTE_TOOLBAR_SET_ACTIVE_COLOR',

  // {String} customColor
  RTE_TOOLBAR_UPDATE_ACTIVE_CUSTOM_COLOR: 'RTE_TOOLBAR_UPDATE_ACTIVE_CUSTOM_COLOR',

  // No payload
  RTE_TOOLBAR_SAVE_ACTIVE_CUSTOM_COLOR: 'RTE_TOOLBAR_SAVE_ACTIVE_CUSTOM_COLOR',

  /**
   * History management
   */

  // {String} storyUid
  HISTORY_UNDO: 'HISTORY_UNDO',

  // {String} storyUid
  HISTORY_REDO: 'HISTORY_REDO',

  /**
   * Generic asset selector flow
   */

  // No payload
  ASSET_SELECTOR_IMAGE_SEARCH_LOAD_MORE: 'ASSET_SELECTOR_IMAGE_SEARCH_LOAD_MORE',

  // {String} phrase
  ASSET_SELECTOR_IMAGE_SEARCH: 'ASSET_SELECTOR_IMAGE_SEARCH',

  // {String} uri
  ASSET_SELECTOR_IMAGE_SELECTED: 'ASSET_SELECTOR_IMAGE_SELECTED',

  // Have the user select an asset, then insert it into
  // the given block and component.
  // {String} blockId
  // {Number} componentIndex
  ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT: 'ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT',

  // {Object} file
  ASSET_SELECTOR_IMAGE_UPLOAD: 'ASSET_SELECTOR_IMAGE_UPLOAD',

  // No payload
  ASSET_SELECTOR_IMAGE_PREVIEW_BACK: 'ASSET_SELECTOR_IMAGE_PREVIEW_BACK',

  // {Object} crop
  // {Number} crop.x
  // {Number} crop.y
  // {Number} crop.width
  // {Number} crop.height
  ASSET_SELECTOR_IMAGE_CROP_SET: 'ASSET_SELECTOR_IMAGE_CROP_SET',

  // No payload
  ASSET_SELECTOR_IMAGE_CROP_COMMIT: 'ASSET_SELECTOR_IMAGE_CROP_COMMIT',

  // No payload
  ASSET_SELECTOR_IMAGE_CROP_START: 'ASSET_SELECTOR_IMAGE_CROP_START',

  // No payload
  ASSET_SELECTOR_IMAGE_CROP_RESET: 'ASSET_SELECTOR_IMAGE_CROP_RESET',

  /**
   * Image embed flow
   */

  ASSET_SELECTOR_CANCEL_FILE_UPLOAD: 'ASSET_SELECTOR_CANCEL_FILE_UPLOAD',

  ASSET_SELECTOR_DRAG_FILES: 'ASSET_SELECTOR_DRAG_FILES',

  // No payload
  ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD: 'ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD',

  // No payload
  ASSET_SELECTOR_TOGGLE_IMAGE_WINDOW_TARGET: 'ASSET_SELECTOR_TOGGLE_IMAGE_WINDOW_TARGET',

  // {String} altAttribute
  ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE: 'ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE',

  // {String} url
  ASSET_SELECTOR_UPDATE_IMAGE_URL_WRAPPER: 'ASSET_SELECTOR_UPDATE_IMAGE_URL_WRAPPER',

  // {String} titleAttribute
  ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE: 'ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE',

  // {String} id
  URL_UPLOAD: 'URL_UPLOAD',

  // {String} id
  // {File, Blob} file
  FILE_UPLOAD: 'FILE_UPLOAD',

  // No payload
  FILE_CANCEL: 'FILE_CANCEL',

  // Edit an existing asset.
  // {String} blockId
  // {number} componentIndex
  // {String} provider. One of:
  //  - 'SOCRATA_VISUALIZATION'
  //  - 'YOUTUBE'
  //  - 'IMAGE'
  //  - 'EMBED_CODE'
  ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED: 'ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED',

  // In the current workflow, jump (usually back) to a specific step.
  // {String} Step. One of AssetSelectorStore.WIZARD_STEP.
  ASSET_SELECTOR_JUMP_TO_STEP: 'ASSET_SELECTOR_JUMP_TO_STEP',

  // No payload
  ASSET_SELECTOR_CLOSE: 'ASSET_SELECTOR_CLOSE',

  // {String} type. New component type.
  ASSET_SELECTOR_UPDATE_COMPONENT_TYPE: 'ASSET_SELECTOR_UPDATE_COMPONENT_TYPE',

  // The user chose an asset provider.
  // {String} provider. One of:
  //  - 'SOCRATA_VISUALIZATION'
  //  - 'YOUTUBE'
  //  - 'IMAGE'
  //  - 'EMBED_CODE'
  ASSET_SELECTOR_PROVIDER_CHOSEN: 'ASSET_SELECTOR_PROVIDER_CHOSEN',

  // The user chose a visualization option.
  // {String} visualizationOption. One of:
  // - 'INSERT_VISUALIZATION'
  // - 'CREATE_VISUALIZATION'
  ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN: 'ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN',

  /**
   * Story tile embed flow
   */

  // {String} url
  ASSET_SELECTOR_UPDATE_STORY_URL: 'ASSET_SELECTOR_UPDATE_STORY_URL',

  // No payload
  ASSET_SELECTOR_TOGGLE_STORY_WINDOW_TARGET: 'ASSET_SELECTOR_TOGGLE_STORY_WINDOW_TARGET',

  /**
   * Goal tile embed flow
   */

  // {String} url
  ASSET_SELECTOR_UPDATE_GOAL_URL: 'ASSET_SELECTOR_UPDATE_GOAL_URL',

  // No payload
  ASSET_SELECTOR_TOGGLE_GOAL_WINDOW_TARGET: 'ASSET_SELECTOR_TOGGLE_GOAL_WINDOW_TARGET',

  /**
   * YouTube embed flow
   */

  // {String} url
  ASSET_SELECTOR_UPDATE_YOUTUBE_URL: 'ASSET_SELECTOR_UPDATE_YOUTUBE_URL',

  /**
   * Socrata visualization flow
   */

  // No payload
  ASSET_SELECTOR_CHOOSE_VISUALIZATION: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION',

  // {String} datasetUid
  // {String} domain
  ASSET_SELECTOR_CHOOSE_MEASURE: 'ASSET_SELECTOR_CHOOSE_MEASURE',

  // {String} datasetUid
  // {boolean} isNewBackend
  // {String} domain
  ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET',

  // {String} mapOrChartUid
  // {String} domain
  ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART',

  // User chose to visualize the dataset as a chart.
  // No payload.
  ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP: 'ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP',

  // {Object} cardData
  ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION: 'ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION',

  /**
   * Code embed flow
   */

  // No payload
  ASSET_SELECTOR_CHOOSE_EMBED_CODE: 'ASSET_SELECTOR_CHOOSE_EMBED_CODE',

  // {String} html
  ASSET_SELECTOR_UPDATE_EMBED_CODE: 'ASSET_SELECTOR_UPDATE_EMBED_CODE',

  // {number} percentLoaded
  EMBED_CODE_UPLOAD_PROGRESS: 'EMBED_CODE_UPLOAD_PROGRESS',

  // No payload
  EMBED_CODE_UPLOAD_DONE: 'EMBED_CODE_UPLOAD_DONE',

  // No payload
  EMBED_CODE_UPLOAD_ERROR: 'EMBED_CODE_UPLOAD_ERROR',

  /**
   * Link Modal
   */

  // No Payload
  LINK_MODAL_CLOSE: 'LINK_MODAL_CLOSE',

  // {String} editorId
  // {String} text
  // {String} url
  // {boolean} openInNewWindow
  LINK_MODAL_OPEN: 'LINK_MODAL_OPEN',

  // {String} text
  // {String} url
  // {boolean} openInNewWindow
  LINK_MODAL_UPDATE: 'LINK_MODAL_UPDATE',

  // {String} text
  // {String} url
  // {boolean} openInNewWindow
  LINK_MODAL_ACCEPT: 'LINK_MODAL_ACCEPT',

  /*
   * Make a Copy flow
   */

  // No payload
  STORY_MAKE_COPY_MODAL_OPEN: 'STORY_MAKE_COPY_MODAL_OPEN',

  // No payload
  STORY_MAKE_COPY_MODAL_SUBMIT: 'STORY_MAKE_COPY_MODAL_SUBMIT',

  // No payload
  STORY_MAKE_COPY_MODAL_CANCEL: 'STORY_MAKE_COPY_MODAL_CANCEL',

  /**
   * Link Action Tip
   */

  // {String} text
  // {String} link
  // {String} editorId
  // {boolean} openInNewWindow
  // {ClientRect} boundingClientRect
  LINK_TIP_OPEN: 'LINK_TIP_OPEN',

  // No Payload
  LINK_TIP_CLOSE: 'LINK_TIP_CLOSE',

  // No Payload
  LINK_TIP_REMOVE: 'LINK_TIP_REMOVE',

  /**
   * Collaborators Modal
   */

  // {Array} collaborators
  //   {collaborator}
  COLLABORATORS_LOAD: 'COLLABORATORS_LOAD',

  // No payload
  COLLABORATORS_OPEN: 'COLLABORATORS_OPEN',

  // {Object} collaborator
  //   {String} email
  //   {String} accessLevel
  COLLABORATORS_ADD: 'COLLABORATORS_ADD',

  // {Object} collaborator
  //   {String} email
  //   {String} accessLevel
  COLLABORATORS_REMOVE: 'COLLABORATORS_REMOVE',

  // {Object} collaborator
  //   {String} email
  //   {String} accessLevel
  COLLABORATORS_MARK_REMOVAL: 'COLLABORATORS_MARK_REMOVAL',

  // {Object} collaborator
  //   {String} email
  //   {String} accessLevel
  COLLABORATORS_UNMARK_REMOVAL: 'COLLABORATORS_UNMARK_REMOVAL',

  // {Object} collaborator
  //   {String} email
  //   {String} accessLevel
  COLLABORATORS_CHANGE: 'COLLABORATORS_CHANGE',

  // No payload
  COLLABORATORS_SAVE: 'COLLABORATORS_SAVE',

  // No payload
  COLLABORATORS_CANCEL: 'COLLABORATORS_CANCEL',

  // No payload
  COLLABORATORS_ERROR: 'COLLABORATORS_ERROR',

  // No payload
  SHARE_AND_EMBED_MODAL_OPEN: 'SHARE_AND_EMBED_MODAL_OPEN',

  // No payload
  SHARE_AND_EMBED_MODAL_CLOSE: 'SHARE_AND_EMBED_MODAL_CLOSE',

  // No payload
  LOGIN_BUTTON_CLICK: 'LOGIN_BUTTON_CLICK',

  // No payload
  GOAL_MIGRATION_START: 'GOAL_MIGRATION_START',

  // {Error} error
  GOAL_MIGRATION_ERROR: 'GOAL_MIGRATION_ERROR',

  // {Array} blocks
  GOAL_MIGRATION_END: 'GOAL_MIGRATION_END',

  // {Object} Downtime
  DOWNTIME_ACKNOWLEDGE: 'DOWNTIME_ACKNOWLEDGE',

  // {String} blockId
  // {Number} componentIndex
  RESET_COMPONENT: 'RESET_COMPONENT',

  // {String} blockId
  // {Number} componentIndex
  MOVE_COMPONENT_START: 'MOVE_COMPONENT_START',

  // {String} blockId
  // {Number} componentIndex
  MOVE_COMPONENT_DESTINATION_CHOSEN: 'MOVE_COMPONENT_DESTINATION_CHOSEN',

  // No Payload
  MOVE_COMPONENT_CANCEL: 'MOVE_COMPONENT_CANCEL',

  // No payload
  GOAL_TITLE_SAVE_START: 'GOAL_TITLE_SAVE_START',

  // No payload
  GOAL_TITLE_SAVE_ERROR: 'GOAL_TITLE_SAVE_ERROR',

  // {String} storyUid
  // {String} title
  GOAL_TITLE_SAVE_FINISH: 'GOAL_TITLE_SAVE_FINISH'
};
