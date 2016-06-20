export default {
  // {object} data: Story data object.
  STORY_CREATE: 'STORY_CREATE',

  // {string} storyUid
  // {string} description
  STORY_SET_DESCRIPTION: 'STORY_SET_DESCRIPTION',

  // {string} storyUid
  // {string} title
  STORY_SET_TITLE: 'STORY_SET_TITLE',

  // {string} storyUid
  // {object} tile
  STORY_SET_TILE_CONFIG: 'STORY_SET_TILE_CONFIG',

  // {string} storyUid
  // {string} theme
  STORY_UPDATE_THEME: 'STORY_UPDATE_THEME',

  // {object} publishedStory
  STORY_SET_PUBLISHED_STORY: 'STORY_SET_PUBLISHED_STORY',

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
  // {string} blockId
  STORY_TOGGLE_BLOCK_PRESENTATION_VISIBILITY: 'STORY_TOGGLE_BLOCK_PRESENTATION_VISIBILITY',

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
  STORY_DRAG_LEAVE: 'STORY_DRAG_LEAVE',

  // {string} storyUid
  // {object} blockContent: Data of block being dragged over story.
  // {object} pointer: Pointer event that triggered this action.
  // {HTMLElement} storyElement: Root of story DOM being dragged over.
  STORY_DRAG_OVER: 'STORY_DRAG_OVER',

  // {string} storyUid
  STORY_DROP: 'STORY_DROP',

  // {string} storyUid
  // {string} blockId
  BLOCK_DOUBLE_CLICK: 'BLOCK_DOUBLE_CLICK',

  /**
   * Rich text editor -> rich text editor toolbar communication
   */

  // {array[string]} activeFormats: Currently available formatters.
  RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS: 'RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS',

  // {string} activeColor
  RTE_TOOLBAR_SET_ACTIVE_COLOR: 'RTE_TOOLBAR_SET_ACTIVE_COLOR',

  // {string} customColor
  RTE_TOOLBAR_UPDATE_ACTIVE_CUSTOM_COLOR: 'RTE_TOOLBAR_UPDATE_ACTIVE_CUSTOM_COLOR',

  // No payload
  RTE_TOOLBAR_SAVE_ACTIVE_CUSTOM_COLOR: 'RTE_TOOLBAR_SAVE_ACTIVE_CUSTOM_COLOR',

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

  // No payload
  ASSET_SELECTOR_IMAGE_SEARCH_LOAD_MORE: 'ASSET_SELECTOR_IMAGE_SEARCH_LOAD_MORE',

  // {string} phrase
  ASSET_SELECTOR_IMAGE_SEARCH: 'ASSET_SELECTOR_IMAGE_SEARCH',

  // {string} uri
  ASSET_SELECTOR_IMAGE_SELECTED: 'ASSET_SELECTOR_IMAGE_SELECTED',

  // Have the user select an asset, then insert it into
  // the given block and component.
  // {string} blockId
  // {number} componentIndex
  ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT: 'ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT',

  /**
   * Image embed flow
   */

  ASSET_SELECTOR_CANCEL_FILE_UPLOAD: 'ASSET_SELECTOR_CANCEL_FILE_UPLOAD',

  ASSET_SELECTOR_DRAG_FILES: 'ASSET_SELECTOR_DRAG_FILES',

  // No payload
  ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD: 'ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD',

  // {string} altAttribute
  ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE: 'ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE',

  // {String} id
  // {File, Blob} file
  FILE_UPLOAD: 'FILE_UPLOAD',

  // No payload
  FILE_CANCEL: 'FILE_CANCEL',

  // Edit an existing asset.
  // {string} blockId
  // {number} componentIndex
  // {string} provider. One of:
  //  - 'SOCRATA_VISUALIZATION'
  //  - 'YOUTUBE'
  //  - 'IMAGE'
  //  - 'EMBED_CODE'
  ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED: 'ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED',

  // In the current workflow, jump (usually back) to a specific step.
  // {string} Step. One of AssetSelectorStore.WIZARD_STEP.
  ASSET_SELECTOR_JUMP_TO_STEP: 'ASSET_SELECTOR_JUMP_TO_STEP',

  // No payload
  ASSET_SELECTOR_CLOSE: 'ASSET_SELECTOR_CLOSE',

  // The user chose an asset provider.
  // {string} provider. One of:
  //  - 'SOCRATA_VISUALIZATION'
  //  - 'YOUTUBE'
  //  - 'IMAGE'
  //  - 'EMBED_CODE'
  ASSET_SELECTOR_PROVIDER_CHOSEN: 'ASSET_SELECTOR_PROVIDER_CHOSEN',

  // The user chose a visualization option.
  // {string} visualizationOption. One of:
  // - 'INSERT_VISUALIZATION'
  // - 'CREATE_VISUALIZATION'
  ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN: 'ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN',

  /**
   * Story tile embed flow
   */

  // {string} url
  ASSET_SELECTOR_UPDATE_STORY_URL: 'ASSET_SELECTOR_UPDATE_STORY_URL',

  // No payload
  ASSET_SELECTOR_TOGGLE_STORY_WINDOW_TARGET: 'ASSET_SELECTOR_TOGGLE_STORY_WINDOW_TARGET',

  /**
   * Goal tile embed flow
   */

  // {string} url
  ASSET_SELECTOR_UPDATE_GOAL_URL: 'ASSET_SELECTOR_UPDATE_GOAL_URL',

  /**
   * YouTube embed flow
   */

  // {string} url
  ASSET_SELECTOR_UPDATE_YOUTUBE_URL: 'ASSET_SELECTOR_UPDATE_YOUTUBE_URL',

  /**
   * Socrata visualization flow
   */

  // No payload
  ASSET_SELECTOR_CHOOSE_VISUALIZATION: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION',

  // {string} datasetUid
  // {boolean} isNewBackend
  // {string} domain
  ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET',

  // {string} mapOrChartUid
  // {string} domain
  ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART: 'ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART',

  // User chose to visualize the dataset as a chart.
  // No payload.
  ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP: 'ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP',

  // {object} cardData
  ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION: 'ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION',

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
  EMBED_CODE_UPLOAD_ERROR: 'EMBED_CODE_UPLOAD_ERROR',

  /**
   * Link Modal
   */

  // No Payload
  LINK_MODAL_CLOSE: 'LINK_MODAL_CLOSE',

  // {string} editorId
  // {string} text
  // {string} url
  // {boolean} openInNewWindow
  LINK_MODAL_OPEN: 'LINK_MODAL_OPEN',

  // {string} text
  // {string} url
  // {boolean} openInNewWindow
  LINK_MODAL_UPDATE: 'LINK_MODAL_UPDATE',

  // {string} text
  // {string} url
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

  // {string} text
  // {string} link
  // {string} editorId
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
  //   {string} email
  //   {string} accessLevel
  COLLABORATORS_ADD: 'COLLABORATORS_ADD',

  // {Object} collaborator
  //   {string} email
  //   {string} accessLevel
  COLLABORATORS_REMOVE: 'COLLABORATORS_REMOVE',

  // {Object} collaborator
  //   {string} email
  //   {string} accessLevel
  COLLABORATORS_MARK_REMOVAL: 'COLLABORATORS_MARK_REMOVAL',

  // {Object} collaborator
  //   {string} email
  //   {string} accessLevel
  COLLABORATORS_UNMARK_REMOVAL: 'COLLABORATORS_UNMARK_REMOVAL',

  // {Object} collaborator
  //   {string} email
  //   {string} accessLevel
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
  LOGIN_BUTTON_CLICK: 'LOGIN_BUTTON_CLICK'
};
