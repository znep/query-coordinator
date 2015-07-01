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

  /**
   * LEGACY
   */

  $(window).on('rich-text-editor::height-change', function() {
    userStoryRenderer.render();
  });

  /*
   * Responsible for:
   *  - Providing STORY_DRAG_ENTER, STORY_DRAG_OVER, STORY_DRAG_LEAVE, and STORY_DROP
   *    actions.
   *  - Providing a ghost visual that follows the pointer.
   *
   *  handles: An array of block elements that can be dragged.
   *  ghostElement: The DOM node to manage as the ghost visual.
   *                All contents will be replaced.
   */
  function DragDrop(handles, ghostElement) {

    var self = this;

    var _draggedBlockId = null;
    var _ghostCursorOffset = 20;
    var _storyUidDraggedOver = undefined;

    self.handles = handles; // Needed for unidragger integration.

    this.dragStart = function(event, pointer) {
      _storyUidDraggedOver = undefined;
      $('body').addClass('dragging');

      var sourceBlockElement = $(pointer.target).parent('.block');

      _draggedBlockId = sourceBlockElement.attr('data-block-id');

      var sourceBlockHtml = sourceBlockElement.html();

      ghostElement.
        html(sourceBlockHtml).
        removeClass('hidden');
    };

    this.dragMove = function(event, pointer, moveVector) {
      var storyUidOver = $(pointer.target).closest('.story').attr('data-story-uid');

      if (storyUidOver !== _storyUidDraggedOver) {
        if (_storyUidDraggedOver) {
          dispatcher.dispatch({
            action: Constants.STORY_DRAG_LEAVE,
            storyUid: _storyUidDraggedOver
          });
          _storyUidDraggedOver = undefined;
        }

        if (storyUidOver) {
          dispatcher.dispatch({
            action: Constants.STORY_DRAG_ENTER,
            storyUid: storyUidOver
          });
          _storyUidDraggedOver = storyUidOver;
        }
      }

      if (_storyUidDraggedOver) {
        dispatcher.dispatch({
          action: Constants.STORY_DRAG_OVER,
          storyUid: _storyUidDraggedOver,
          blockId: $(pointer.target).closest('.block').attr('data-block-id')
        });
      }

      ghostElement.
        css({
          left: self.dragStartPoint.x + moveVector.x - _ghostCursorOffset,
          top: self.dragStartPoint.y + moveVector.y - _ghostCursorOffset
        });
    };

    this.dragEnd = function() {

      var dragged = _draggedBlockId;

      $('body').removeClass('dragging');
      _draggedBlockId = null;
      ghostElement.addClass('hidden');

      dispatcher.dispatch({
        action: Constants.STORY_DROP,
        blockId: dragged,
        storyUid: window.userStoryUid
      });
    };

    this.bindHandles();

    window.dragDropStore.addChangeListener(function() {
      if (window.dragDropStore.isDraggingOverStory(userStoryUid)) {
        ghostElement.addClass('full-size');
      } else {
        ghostElement.removeClass('full-size');
      }
    });

  };

  DragDrop.prototype = Unidragger.prototype;

  var dragDrop = new DragDrop(inspirationStoryElement.find('.block'), $('#block-ghost'));

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
