'use strict';

$(document).on('ready', function() {

  /**
   * Setup
   */

  var assetFinder = new AssetFinder();

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

  window.inspirationStoryUid = inspirationStoryData.uid;
  window.userStoryUid = userStoryData.uid;

  window.dispatcher = new Dispatcher();
  window.dispatcher.register(function(payload) {
    window.console && console.info('Dispatcher action: ', payload);
    if (typeof payload.action !== 'string') {
      throw new Error(
        'Undefined action.'
      );
    }
  });

  window.storyStore = new StoryStore();
  window.historyStore = new HistoryStore();
  window.dragDropStore = new DragDropStore();

  window.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: inspirationStoryData });
  window.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: userStoryData });

  var richTextEditorToolbar = new RichTextEditorToolbar(
    $('#rich-text-editor-toolbar'),
    richTextFormats
  );

  var richTextEditorManager = new RichTextEditorManager(
    assetFinder,
    richTextEditorToolbar,
    richTextFormats
  );

  var inspirationStoryOptions = {
    storyUid: window.inspirationStoryUid,
    storyContainerElement: $('.inspiration-story'),
    scaleFactor: 0.5,
    editable: false,
    onRenderError: function() { $('.inspiration-story-error').removeClass('hidden'); }
  };
  var inspirationStoryRenderer = new StoryRenderer(inspirationStoryOptions);

  var userStoryOptions = {
    storyUid: window.userStoryUid,
    storyContainerElement: $('.user-story'),
    editable: true,
    insertionHintElement: $('#story-insertion-hint'),
    richTextEditorManager: richTextEditorManager,
    onRenderError: function() {}
  };
  var userStoryRenderer = new StoryRenderer(userStoryOptions);

  var inspirationStoryElement = $('.inspiration-story-container');
  var userStoryElement = $('.user-story-container');
  var ghostElement = $('#block-ghost');
  var dragDrop = new DragDrop(inspirationStoryElement.find('.block'), ghostElement);
  dragDrop.setup();

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

      window.dispatcher.dispatch({
        action: Constants.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
        activeFormats: []
      });
    }
  });

  $(window).on('rich-text-editor::format-change', function(event) {

    window.dispatcher.dispatch({
      action: Constants.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
      activeFormats: event.originalEvent.detail.content
    });
  });

  // Handle updates to block content.
  $(window).on('rich-text-editor::content-change', function(event) {

    var editorIdComponents = event.originalEvent.detail.id.split('-');
    var editorIdComponentCount = editorIdComponents.length - 1;
    var componentIndex = editorIdComponents[editorIdComponentCount];

    // Remove the last (component index) element
    editorIdComponents.length = editorIdComponentCount;
    var blockId = editorIdComponents.join('-');

    var blockContent = event.originalEvent.detail.content;

    window.dispatcher.dispatch({
      action: Constants.BLOCK_UPDATE_COMPONENT,
      blockId: blockId,
      index: componentIndex,
      type: 'text',
      value: blockContent
    });
  });

  window.dispatcher.register(function(payload) {
    if (payload.action === Constants.STORY_DELETE_BLOCK) {

      var components = storyStore.getBlockComponents(payload.blockId);

      for (var i = 0; i < components.length; i++) {

        var editorId = payload.blockId + '-' + i;

        richTextEditorManager.deleteEditor(editorId);
      }
    }
  });

  /**
   * History events
   */

   $('.undo-btn').on('click', function() {

      window.dispatcher.dispatch({
        action: Constants.HISTORY_UNDO,
        storyUid: userStoryUid
      });
   });

   $('.redo-btn').on('click', function() {

      window.dispatcher.dispatch({
        action: Constants.HISTORY_REDO,
        storyUid: userStoryUid
      });
   });

  window.historyStore.addChangeListener(function() {

    if (window.historyStore.canUndo()) {
      $('.undo-btn').prop('disabled', false);
    } else {
      $('.undo-btn').prop('disabled', true);
    }

    if (window.historyStore.canRedo()) {
      $('.redo-btn').prop('disabled', false);
    } else {
      $('.redo-btn').prop('disabled', true);
    }
  });

  /**
   * Drag and drop events
   */

  window.dragDropStore.addChangeListener(function() {
    if (window.dragDropStore.isDraggingOverStory(userStoryUid)) {
      ghostElement.addClass('full-size');
    } else {
      ghostElement.removeClass('full-size');
    }
  });

  // Handlers for mouse events on inspiration story.
  window.dispatcher.register(function(payload) {
    if (payload.storyUid !== inspirationStoryUid) {
      return;
    }

    switch(payload.action) {
      case Constants.BLOCK_DOUBLE_CLICK:
        window.dispatcher.dispatch({
          action: Constants.BLOCK_COPY_INTO_STORY,
          blockId: payload.blockId,
          storyUid: window.userStoryUid,
          insertAt: window.storyStore.getBlockIds(window.userStoryUid).length
        });

        break;
    }
  });

  // Respond to changes in the user story's block ordering by scrolling the
  // window to always show the top of the moved block.
  dispatcher.register(
    function(payload) {

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
    }
  );

});
