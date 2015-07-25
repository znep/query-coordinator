'use strict';

$(document).on('ready', function() {
  var namespace = window.socrata.storyteller
  /**
   * Setup
   */

  var assetFinder = new namespace.AssetFinder();

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
  if (userStoryData.version === null) {
    userStoryData.version = '';
  }

  // If we're loading an empty story for the first time, add example content
  if ((userStoryData.version === '') && (userStoryData.blocks.length === 0)) {
    userStoryData.blocks = sampleBlocks;
  }

  /**
   * FLUX
   */

  namespace.userStoryUid = userStoryData.uid;

  namespace.dispatcher = new namespace.Dispatcher();
  namespace.dispatcher.register(function(payload) {
    namespace.console && console.info('Dispatcher action: ', payload);
    if (typeof payload.action !== 'string') {
      throw new Error(
        'Undefined action.'
      );
    }
  });

  namespace.storyStore = new namespace.StoryStore();
  namespace.historyStore = new namespace.HistoryStore();
  namespace.dragDropStore = new namespace.DragDropStore();
  namespace.embedWizardStore = new namespace.EmbedWizardStore();
  namespace.blockRemovalConfirmationStore = new namespace.BlockRemovalConfirmationStore();

  var richTextEditorToolbar = new namespace.RichTextEditorToolbar(
    $('#rich-text-editor-toolbar'),
    richTextFormats
  );

  var richTextEditorManager = new namespace.RichTextEditorManager(
    assetFinder,
    richTextEditorToolbar,
    richTextFormats
  );

  namespace.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: userStoryData });

  var embedWizardOptions = {
    embedWizardContainerElement: $('#embed-wizard')
  };
  var embedWizardRenderer = new namespace.EmbedWizardRenderer(embedWizardOptions);

  var userStoryOptions = {
    storyUid: namespace.userStoryUid,
    storyContainerElement: $('.user-story'),
    editable: true,
    insertionHintElement: $('#story-insertion-hint'),
    richTextEditorManager: richTextEditorManager,
    warningMessageElement: $('.user-story .message-warning'),
    onRenderError: function() {}
  };
  var userStoryRenderer = new namespace.StoryRenderer(userStoryOptions);

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

      namespace.dispatcher.dispatch({
        action: Constants.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
        activeFormats: []
      });
    }
  });

  /**
   * History events
   */

   $('.undo-btn').on('click', function() {

      namespace.dispatcher.dispatch({
        action: Constants.HISTORY_UNDO,
        storyUid: userStoryUid
      });
   });

   $('.redo-btn').on('click', function() {

      namespace.dispatcher.dispatch({
        action: Constants.HISTORY_REDO,
        storyUid: userStoryUid
      });
   });

  namespace.historyStore.addChangeListener(function() {

    if (namespace.historyStore.canUndo()) {
      $('.undo-btn').prop('disabled', false);
    } else {
      $('.undo-btn').prop('disabled', true);
    }

    if (namespace.historyStore.canRedo()) {
      $('.redo-btn').prop('disabled', false);
    } else {
      $('.redo-btn').prop('disabled', true);
    }
  });

  /**
   * Drag and drop events
   */

  namespace.dragDropStore.addChangeListener(function() {
    if (namespace.dragDropStore.isDraggingOverStory(userStoryUid)) {
      ghostElement.addClass('full-size');
    } else {
      ghostElement.removeClass('full-size');
    }
  });

  // Respond to changes in the user story's block ordering by scrolling the
  // window to always show the top of the moved block.
  namespace.dispatcher.register(function(payload) {

    if (payload.storyUid === userStoryUid) {

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
  var addContentPanelElement = $('.add-content-panel');
  addContentPanelElement.addContentPanel($('.add-content-panel-btn'));

  // Drag-drop
  var ghostElement = $('#block-ghost');
  var dragDrop = new namespace.DragDrop(addContentPanelElement.find('.inspiration-block'), ghostElement);
  dragDrop.setup();

  // Story title
  $('.story-title').storyTitle(namespace.userStoryUid);

  // Modals
  $('.preview-btn').on('click', function() {

  });
});

