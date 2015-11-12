$(document).on('ready', function() {

  'use strict';

  var storyteller = window.socrata.storyteller;

  /**
   * Setup
   */

  storyteller.csrfToken = $('meta[name="csrf-token"]').attr('content');

  var airbrakeOptions = {
    'projectKey': storyteller.config.getAirbrakeConfig('projectKey'),
    'projectId': storyteller.config.getAirbrakeConfig('projectId')
  };

  if (airbrakeOptions.projectKey !== null) {
    storyteller.airbrake = new airbrakeJs.Client(airbrakeOptions);
    storyteller.airbrake.addFilter(function(notice) {
      notice.context.environment = storyteller.config.getAirbrakeConfig('environment');
      return notice;
    });
  }

  storyteller.notifyAirbrake = function(error) {
    if (!_.isUndefined(storyteller.airbrake)) {
      storyteller.airbrake.notify(error);
    }
    console.error(error);
  };

  $(window).error(function(event) {
    storyteller.notifyAirbrake(event.originalEvent.error);
  });

  storyteller.assetFinder = new storyteller.AssetFinder();
  storyteller.storyPermissionsManager = new storyteller.StoryPermissionsManager();
  storyteller.storyActionsManager = new storyteller.StoryActionsManager();

  var richTextFormats = [
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
  ];

  /**
   * FLUX
   */

  storyteller.userStoryUid = userStoryData.uid;

  storyteller.dispatcher = new storyteller.Dispatcher();
  storyteller.dispatcher.register(function(payload) {

    if (storyteller.config.environment === 'development' && window.console) {
      console.info('Dispatcher action: ', payload);
    }

    if (typeof payload.action !== 'string') {
      throw new Error(
        'Undefined action.'
      );
    }
  });

  storyteller.linkStore = new storyteller.LinkStore();
  storyteller.storyStore = new storyteller.StoryStore();
  storyteller.historyStore = new storyteller.HistoryStore(storyteller.userStoryUid);
  storyteller.dragDropStore = new storyteller.DragDropStore();
  storyteller.assetSelectorStore = new storyteller.AssetSelectorStore();
  storyteller.blockRemovalConfirmationStore = new storyteller.BlockRemovalConfirmationStore();
  storyteller.coreSavingStore = new storyteller.CoreSavingStore();
  storyteller.windowSizeBreakpointStore = new storyteller.WindowSizeBreakpointStore();
  storyteller.storySaveStatusStore = new storyteller.StorySaveStatusStore(storyteller.userStoryUid);
  storyteller.fileUploadStore = new storyteller.FileUploadStore();
  storyteller.storyCopierStore = new storyteller.StoryCopierStore();
  storyteller.flyoutRenderer = new socrata.visualizations.FlyoutRenderer();

  socrata.visualizations.RowInspector.setup();

  var richTextEditorToolbar = new storyteller.RichTextEditorToolbar(
    $('#rich-text-editor-toolbar'),
    richTextFormats
  );

  var richTextEditorManager = new storyteller.RichTextEditorManager(
    storyteller.assetFinder,
    richTextEditorToolbar,
    richTextFormats
  );
  storyteller.richTextEditorManager = richTextEditorManager;

  storyteller.dispatcher.dispatch({ action: Actions.STORY_CREATE, data: userStoryData });

  var assetSelectorOptions = {
    assetSelectorContainerElement: $('#asset-selector-container')
  };

  var assetSelectorRenderer = new storyteller.AssetSelectorRenderer(assetSelectorOptions); //eslint-disable-line no-unused-vars
  var linkModalRenderer = new storyteller.LinkModalRenderer(); //eslint-disable-line no-unused-vars

  var storyCopierOptions = {
    storyCopierContainerElement: $('#make-a-copy-container')
  };

  // Randy says that this API "should be reviewed and maybe changed".
  var storyCopierRenderer = new storyteller.StoryCopierRenderer(storyCopierOptions); //eslint-disable-line no-unused-vars

  var userStoryOptions = {
    storyUid: storyteller.userStoryUid,
    storyContainerElement: $('.user-story'),
    editable: true,
    insertionHintElement: $('#story-insertion-hint'),
    richTextEditorManager: richTextEditorManager,
    warningMessageElement: $('.user-story .message-warning'),
    onRenderError: function() {}
  };

  var userStoryRenderer = new storyteller.StoryRenderer(userStoryOptions); //eslint-disable-line no-unused-vars

  /**
   * RichTextEditorToolbar events
   */

  $(window).on('rich-text-editor::focus-change', function(event) {
    var editors;
    var currentEditorId;

    // If an editor is being focused, we must switch the link toolbar's context,
    // and deselect all other editors.
    if (event.originalEvent.detail.content === true) {
      currentEditorId = event.originalEvent.detail.id;
      editors = _.omit(richTextEditorManager.getAllEditors(), currentEditorId);

      richTextEditorManager.linkToolbar(currentEditorId);
      _.invoke(editors, 'deselect');
    }
  });

  $(window).on('click', function(event) {

    var target = $(event.target);

    var isInToolbar = target.is($('#rich-text-editor-toolbar')) || target.parents('#rich-text-editor-toolbar').length !== 0;
    var isInLinkModal = target.is($('#link-modal')) || target.parents('#link-modal').length !== 0;

    // If the target of the click event is not the toolbar, unlink
    // the toolbar from the current ext editor (which also dims the
    // toolbar), and deselect all rich text editors.
    if (!isInToolbar && !isInLinkModal) {

      richTextEditorManager.unlinkToolbar();

      storyteller.dispatcher.dispatch({
        action: Actions.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
        activeFormats: []
      });

      _.invoke(richTextEditorManager.getAllEditors(), 'deselect');
    }
  });

  /**
   * History events
   */

  $('.undo-btn').on('click', function() {

    storyteller.dispatcher.dispatch({
      action: Actions.HISTORY_UNDO,
      storyUid: storyteller.userStoryUid
    });
  });

  $('.redo-btn').on('click', function() {

    storyteller.dispatcher.dispatch({
      action: Actions.HISTORY_REDO,
      storyUid: storyteller.userStoryUid
    });
  });

  storyteller.historyStore.addChangeListener(function() {

    if (storyteller.historyStore.canUndo()) {
      $('.undo-btn').prop('disabled', false);
    } else {
      $('.undo-btn').prop('disabled', true);
    }

    if (storyteller.historyStore.canRedo()) {
      $('.redo-btn').prop('disabled', false);
    } else {
      $('.redo-btn').prop('disabled', true);
    }
  });

  /**
   * Drag and drop events
   */

  storyteller.dragDropStore.addChangeListener(function() {
    if (storyteller.dragDropStore.isDraggingOverStory(storyteller.userStoryUid)) {
      ghostElement.addClass('full-size');
    } else {
      ghostElement.removeClass('full-size');
    }
  });

  // Respond to changes in the user story's block ordering by scrolling the
  // window to always show the top of the moved block.
  storyteller.dispatcher.register(function(payload) {

    if (payload.storyUid === storyteller.userStoryUid) {

      switch (payload.action) {

        case Actions.STORY_MOVE_BLOCK_UP:
        case Actions.STORY_MOVE_BLOCK_DOWN:

          // Ensure that the layout is performed before we try to read
          // back the y translate value. Since the renderer is synchronous
          // a minimal setTimeout here should cause this block to be executed
          // after the renderer has completed.
          setTimeout(function() {

            var blockEditElement = document.querySelectorAll(
              '.block-edit[data-block-id="' + payload.blockId + '"]'
            )[0];

            var blockEditElementTranslateY =
              parseInt(
                blockEditElement.getAttribute('data-translate-y'),
                10
              ) || 0;

            $('html, body').animate({
              scrollTop: blockEditElementTranslateY
            });
          // The duration of the layout translations is specified in
          // `layout.scss`.
          }, 200);
          break;

        default:
          break;
      }
    }
  });

  /**
   * Set up controls/widgets
   */

  // Add Content Panel
  var addContentPanelElement = $('#add-content-panel');
  addContentPanelElement.addContentPanel($('.menu [data-panel-toggle="add-content-panel"]'));

  // Style and Presentation Panel
  var styleAndPresentationPanelElement = $('#style-and-presentation-panel');
  styleAndPresentationPanelElement.styleAndPresentationPanel($('.menu button[data-panel-toggle="style-and-presentation-panel"]'));

  // Settings Panel
  var settingsPanelContainer = $('#settings-panel-container');
  settingsPanelContainer.settingsPanel($('[data-panel-toggle="settings-panel"]'));

  // Drag-drop
  var ghostElement = $('#block-ghost');
  var dragDrop = new storyteller.DragDrop(addContentPanelElement.find('.inspiration-block'), ghostElement);
  dragDrop.setup();

  // Story title
  $('title, .story-title').storyTitle(storyteller.userStoryUid);

  // Draft or Published status
  $('#story-publication-status').storyPublicationStatus(storyteller.userStoryUid);

  // Save status
  $('#story-saving-indicator').storySavingStatus();
  $('#story-save-error-bar').storySaveErrorBar();

  // Preview button
  $('.preview-btn').storyPreviewLink();

  // Autosave
  storyteller.autosave = new storyteller.Autosave(storyteller.userStoryUid);

  // Close confirmation
  $(window).on('beforeunload', function() {
    if (
      storyteller.storySaveStatusStore.isStoryDirty() ||
      storyteller.storySaveStatusStore.isStorySaveInProgress()
    ) {
      // If the save is impossible, don't bother confirming the close :(
      if (!storyteller.storySaveStatusStore.isSaveImpossibleDueToConflict()) {
        return I18n.t('editor.page_close_confirmation');
      }
    }

  });
});

