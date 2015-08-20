$(document).on('ready', function() {

  'use strict';

  var storyteller = window.socrata.storyteller;

  /**
   * Setup
   */

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

  storyteller.notifyAirbrake = function() {
    if (!_.isUndefined(storyteller.airbrake)) {
      storyteller.airbrake.notify(arguments);
    }
  };

  storyteller.assetFinder = new storyteller.AssetFinder();

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

  // Temporary fix until version is being added/populated
  if (userStoryData.digest === null) {
    userStoryData.digest = '';
  }

  // If we're loading an empty story for the first time, add example content
  if ((userStoryData.digest === '') && (userStoryData.blocks.length === 0)) {
    userStoryData.blocks = sampleBlocks;
  }

  /**
   * FLUX
   */

  storyteller.userStoryUid = userStoryData.uid;

  storyteller.dispatcher = new storyteller.Dispatcher();
  storyteller.dispatcher.register(function(payload) {

    if (window.console) {
      console.info('Dispatcher action: ', payload);
    }

    if (typeof payload.action !== 'string') {
      throw new Error(
        'Undefined action.'
      );
    }
  });

  storyteller.storyStore = new storyteller.StoryStore();
  storyteller.historyStore = new storyteller.HistoryStore();
  storyteller.dragDropStore = new storyteller.DragDropStore();
  storyteller.embedWizardStore = new storyteller.EmbedWizardStore();
  storyteller.blockRemovalConfirmationStore = new storyteller.BlockRemovalConfirmationStore();
  storyteller.coreSavingStore = new storyteller.CoreSavingStore();
  storyteller.flyoutRenderer = new storyteller.FlyoutRenderer();

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

  storyteller.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: userStoryData });

  var embedWizardOptions = {
    embedWizardContainerElement: $('#embed-wizard')
  };

  var embedWizardRenderer = new storyteller.EmbedWizardRenderer(embedWizardOptions); //eslint-disable-line no-unused-vars

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

    if (event.originalEvent.detail.content === true) {
      richTextEditorManager.linkToolbar(event.originalEvent.detail.id);
    }
  });

  $(window).on('click', function(event) {

    var target = $(event.target);

    // If the target of the click event is not the toolbar, unlink
    // the toolbar from the current ext editor (which also dims the
    // toolbar).
    if (!target.is($('#rich-text-editor-toolbar')) &&
      target.parents('#rich-text-editor-toolbar').length === 0) {

      richTextEditorManager.unlinkToolbar();

      storyteller.dispatcher.dispatch({
        action: Constants.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
        activeFormats: []
      });
    }
  });

  /**
   * History events
   */

  $('.undo-btn').on('click', function() {

    storyteller.dispatcher.dispatch({
      action: Constants.HISTORY_UNDO,
      storyUid: storyteller.userStoryUid
    });
  });

  $('.redo-btn').on('click', function() {

    storyteller.dispatcher.dispatch({
      action: Constants.HISTORY_REDO,
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

        case Constants.STORY_MOVE_BLOCK_UP:
        case Constants.STORY_MOVE_BLOCK_DOWN:

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
  addContentPanelElement.addContentPanel($('.add-content-panel-btn'));

  // Settings Panel
  var settingsPanelContainer = $('#settings-panel-container');
  settingsPanelContainer.settingsPanel($('[data-panel-toggle="settings-panel"]'));

  // Drag-drop
  var ghostElement = $('#block-ghost');
  var dragDrop = new storyteller.DragDrop(addContentPanelElement.find('.inspiration-block'), ghostElement);
  dragDrop.setup();

  // Story title
  $('.story-title').storyTitle(storyteller.userStoryUid);

  // Modals
  $('.preview-btn').on('click', function() {

  });
});

