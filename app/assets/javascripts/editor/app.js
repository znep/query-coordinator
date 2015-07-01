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

  //TODO eurgh
  var lastInsertionHintIndex = -1;

  function DragDrop(element, handles, ghostElement) {

    var _self = this;
    var _dragging = null;
    var _ghostElement = ghostElement;
    var _ghostCursorOffset = 20;

    _self.handles = handles;

    this.dragStart = function(event, pointer) {
      lastInsertionHintIndex = -1;
      $('body').addClass('dragging');
      var inspirationBlock = $(pointer.target).parent('.block');

      _dragging = inspirationBlock.attr('data-block-id');

      var inspirationBlockHtml = inspirationBlock.html();

      _ghostElement.
        html(inspirationBlockHtml).
        removeClass('hidden');
    };

    this.dragMove = function(event, pointer, moveVector) {
      _ghostElement.
        css({
          left: _self.dragStartPoint.x + moveVector.x - _ghostCursorOffset,
          top: _self.dragStartPoint.y + moveVector.y - _ghostCursorOffset
        });
    };

    this.dragEnd = function() {

      var dragged = _dragging;

      $('body').removeClass('dragging');
      _dragging = null;
      _ghostElement.addClass('hidden');

      var insertAt;

      if (lastInsertionHintIndex >= 0) {
        insertAt = lastInsertionHintIndex;
      } else {
        insertAt = storyStore.getBlockIds(window.userStoryUid).length;
      }

      dispatcher.dispatch({
        action: Constants.BLOCK_COPY_INTO_STORY,
        blockId: dragged,
        storyUid: window.userStoryUid,
        insertAt: insertAt
      });
    };

    this.addGhostClass = function(className) {
      _ghostElement.addClass(className);
    };

    this.removeGhostClass = function(className) {
      _ghostElement.removeClass(className);
    };

    this.bindHandles();
  };

  DragDrop.prototype = Unidragger.prototype;

  var dragDrop = new DragDrop(inspirationStoryElement[0], inspirationStoryElement.find('.block'), $('#block-ghost'));


  function showInsertionHintAtIndex(index) {
    userStoryRenderer.showInsertionHintAtIndex(index);
    lastInsertionHintIndex = index;
  }
  function hideInsertionHint() {
    userStoryRenderer.hideInsertionHint();
  }

  userStoryElement.on('mouseenter', function() {

    if (dragDrop.isDragging) {
      dragDrop.addGhostClass('full-size');
    }
  });

  userStoryElement.on('mouseleave', function() {

    if (dragDrop.isDragging) {
      dragDrop.removeGhostClass('full-size');
    }

    hideInsertionHint();
  });

  userStoryElement.on('mousemove', '.block', function(e) {
    if (dragDrop.isDragging) {
      var blockElement = $(e.currentTarget);
      var blockId = blockElement.attr('data-block-id');

      if (blockId) {
        var indexToHint = storyStore.getBlockIds(window.userStoryUid).indexOf(blockId);
        if (indexToHint >= 0) {
          showInsertionHintAtIndex(indexToHint + 1);
        }
      } else {
        hideInsertionHint();
      }
    }
  });

  $(window).on('mouseup', function() {
    hideInsertionHint();
  });

  inspirationStoryElement.on('dblclick', '.block', function(e) {

    window.dispatcher.dispatch({
      action: Constants.BLOCK_COPY_INTO_STORY,
      blockId: e.currentTarget.getAttribute('data-block-id'),
      storyUid: window.userStoryUid,
      insertAt: window.storyStore.getBlockIds(window.userStoryUid).length
    });
  });

});
