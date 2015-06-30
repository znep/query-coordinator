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

  window.dispatcher = new Dispatcher();
  window.dispatcher.register(function(payload) {
    console.info('Dispatcher action: ', payload);
  });

  window.storyStore = new StoryStore();
  window.blockStore = new BlockStore();

  window.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: inspirationStoryData });
  window.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: userStoryData });

  var inspirationStoryOptions = {
    storyUid: inspirationStoryData.uid,
    storyContainerElement: $('.inspiration-story'),
    scaleFactor: 0.5,
    editable: false,
    onRenderError: function() { $('.inspiration-story-error').removeClass('hidden'); }
  };
  var inspirationStoryRenderer = new StoryRenderer(inspirationStoryOptions);

  var userStoryOptions = {
    storyUid: userStoryData.uid,
    storyContainerElement: $('.user-story'),
    editable: true,
    insertionHintElement: $('#story-insertion-hint'),
    richTextEditorManager: richTextEditorManager,
    onRenderError: function() {}
  };
  var userStoryRenderer = new StoryRenderer(userStoryOptions);

  /**
   * LEGACY
   */

  $(window).on('rich-text-editor::height-change', function(e) {
    userStoryRenderer.render();
  });

  function DragDrop(ghostElement) {

    var _self = this;
    var _dragging = null;
    var _ghostElement = ghostElement;
    var _ghostCursorOffset = 20;

    this.isDragging = function() {
      return _dragging !== null;
    };

    this.drag = function(mouseX, mouseY, block) {

      $('body').addClass('dragging');
      var inspirationBlock = $('[data-block-id=' + block.getId() + ']');
      var inspirationBlockHtml = inspirationBlock.html();
      var inspirationBlockOffset = inspirationBlock.offset();

      _dragging = block;
      _ghostElement.
        html(inspirationBlockHtml).
        css({
          left: mouseX - _ghostCursorOffset,
          top: mouseY - _ghostCursorOffset
        }).
        removeClass('hidden');
    };

    this.drop = function() {

      var dragged = _dragging;

      $('body').removeClass('dragging');
      _dragging = null;
      _ghostElement.addClass('hidden');
      return dragged;
    };

    this.addGhostClass = function(className) {
      _ghostElement.addClass(className);
    };

    this.removeGhostClass = function(className) {
      _ghostElement.removeClass(className);
    };

    $(window).on('mousemove', function(e) {
      if (_self.isDragging()) {
        _ghostElement.css({
          left: e.clientX - _ghostCursorOffset,
          top: e.clientY - _ghostCursorOffset
        });
      }
    });
  };

  var dragDrop = new DragDrop($('#block-ghost'));

  var lastInsertionHintIndex = -1;
  function showInsertionHintAtIndex(index) {
    userStoryRenderer.showInsertionHintAtIndex(index);
    lastInsertionHintIndex = index;
  }
  function hideInsertionHint() {
    userStoryRenderer.hideInsertionHint();
    lastInsertionHintIndex = -1;
  }

  $('.inspiration-story').on('mousedown', '.block', function(e) {

    var blockId = e.currentTarget.getAttribute('data-block-id');
    var block = inspirationStory.getBlockWithId(blockId);

    dragDrop.drag(e.clientX, e.clientY, block);
  });

  $('.inspiration-story').on('dblclick', '.block', function(e) {
    var blockId = e.currentTarget.getAttribute('data-block-id');
    var blockToInsert = inspirationStory.getBlockWithId(blockId);

    userStory.appendBlock(blockToInsert.clone());
    userStoryRenderer.render();
  });

  $('.user-story-container').on('mouesenter', function() {

    if (dragDrop.isDragging()) {
      dragDrop.addGhostClass('full-size');
    }
  });

  $('.user-story-container').on('mouseleave', function() {

    if (dragDrop.isDragging()) {
      dragDrop.removeGhostClass('full-size');
    }

    hideInsertionHint();
  });

  $('.user-story-container').on('mousemove', '.block', function(e) {
    if (dragDrop.isDragging()) {
      var blockElement = $(e.currentTarget);
      var blockId = blockElement.attr('data-block-id');

      if (blockId) {
        var indexToHint = _.invoke(userStory.getBlocks(), 'getId').indexOf(blockId);
        if (indexToHint >= 0) {
          showInsertionHintAtIndex(indexToHint + 1);
        }
      } else {
        hideInsertionHint();
      }
    }
  });

  $(window).on('mouseup', function(e) {

    if (dragDrop.isDragging()) {
      dragDrop.drop();
    }

    hideInsertionHint();
  });

  $('.user-story-container').on('mouseup', function(e) {

    if (dragDrop.isDragging()) {

      var blockToInsert = dragDrop.drop().clone();

      if (lastInsertionHintIndex >= 0) {
        userStory.insertBlockAtIndex(lastInsertionHintIndex, blockToInsert);
      } else {
        userStory.appendBlock(blockToInsert);
      }

      userStoryRenderer.render();
    }
  });
});
