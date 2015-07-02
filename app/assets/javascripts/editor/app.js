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

  $(window).on('rich-text-editor::height-change', function(event) {
    userStoryRenderer.render();
  });

  /**
   * LEGACY
   */

  function DragDrop(ghostElement) {

    var _self = this;
    var _dragging = null;
    var _ghostElement = ghostElement;
    var _ghostCursorOffset = 20;

    this.isDragging = function() {
      return _dragging !== null;
    };

    this.drag = function(mouseX, mouseY, blockId) {

      $('body').addClass('dragging');
      var inspirationBlock = $('[data-block-id=' + blockId + ']');
      var inspirationBlockHtml = inspirationBlock.html();

      _dragging = blockId;
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

  inspirationStoryElement.on('mousedown', '.block', function(e) {

    var blockId = e.currentTarget.getAttribute('data-block-id');

    dragDrop.drag(e.clientX, e.clientY, blockId);
  });

  inspirationStoryElement.on('dblclick', '.block', function(e) {

    window.dispatcher.dispatch({
      action: Constants.BLOCK_COPY_INTO_STORY,
      blockId: e.currentTarget.getAttribute('data-block-id'),
      storyUid: window.userStoryUid,
      insertAt: window.storyStore.getBlockIds(window.userStoryUid).length
    });
  });

  userStoryElement.on('mouseenter', function() {

    if (dragDrop.isDragging()) {
      dragDrop.addGhostClass('full-size');
    }
  });

  userStoryElement.on('mouseleave', function() {

    if (dragDrop.isDragging()) {
      dragDrop.removeGhostClass('full-size');
    }

    hideInsertionHint();
  });

  userStoryElement.on('mousemove', '.block', function(e) {
    if (dragDrop.isDragging()) {
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

    if (dragDrop.isDragging()) {
      dragDrop.drop();
    }

    hideInsertionHint();
  });

  userStoryElement.on('mouseup', function() {

    if (dragDrop.isDragging()) {

      var blockIdToInsert = dragDrop.drop();
      var insertAt;

      if (lastInsertionHintIndex >= 0) {
        insertAt = lastInsertionHintIndex;
      } else {
        insertAt = storyStore.getBlockIds(window.userStoryUid).length;
      }

      dispatcher.dispatch({
        action: Constants.BLOCK_COPY_INTO_STORY,
        blockId: blockIdToInsert,
        storyUid: window.userStoryUid,
        insertAt: insertAt
      });
    }
  });
});
