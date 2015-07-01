'use strict';

$(document).on('ready', function() {

  /**
   * Setup
   */

  var assetFinder = new AssetFinder();

  var richTextFormats = [
    { id: 'heading1', tag: 'h2', name: 'Heading 1', dropdown: true },
    { id: 'heading2', tag: 'h3', name: 'Heading 2', dropdown: true },
    { id: 'heading3', tag: 'h4', name: 'Heading 3', dropdown: true },
    { id: 'heading4', tag: 'h5', name: 'Heading 4', dropdown: true },
    { id: 'text', tag: null, name: 'Paragraph', dropdown: true },
    { id: 'bold', tag: 'b', name: 'Bold', dropdown: false, group: 0 },
    { id: 'italic', tag: 'i', name: 'Italic', dropdown: false, group: 0 },
    { id: 'left', tag: 'p', name: 'Align Left', dropdown: false, group: 1 },
    { id: 'center', tag: 'p', name: 'Align Center', dropdown: false, group: 1 },
    { id: 'right', tag: 'p', name: 'Align Right', dropdown: false, group: 1 },
    { id: 'orderedList', tag: 'ol', name: 'Ordered List', dropdown: false, group: 2 },
    { id: 'unorderedList', tag: 'ul', name: 'Unordered List', dropdown: false, group: 2 },
    { id: 'blockquote', tag: 'blockquote', name: 'Block Quote', dropdown: false, group: 2 },
    { id: 'link', tag: 'a', name: 'Link', dropdown: false, group: 3 }
  ];

  var richTextEditorToolbar = new RichTextEditorToolbar(
    $('#rich-text-editor-toolbar'),
    richTextFormats
  );

  var richTextEditorManager = new RichTextEditorManager(
    assetFinder,
    richTextEditorToolbar,
    richTextFormats
  );

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
    console.info('Dispatcher action: ', payload);
    if (typeof payload.action !== 'string') {
      throw new Error(
        'Undefined action.'
      );
    }
  });

  window.storyStore = new StoryStore();
  window.blockStore = new BlockStore();
  window.dragDropStore = new DragDropStore();

  window.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: inspirationStoryData });
  window.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: userStoryData });

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

  $(window).on('rich-text-editor::height-change', function() {
    userStoryRenderer.render();
  });

  var ghostElement = $('#block-ghost');
  var dragDrop = new DragDrop(inspirationStoryElement.find('.block'), ghostElement);
  dragDrop.setup();

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

});
