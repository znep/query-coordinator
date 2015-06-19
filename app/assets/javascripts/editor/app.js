$(document).on('ready', function() {

  var textEditorManager = new TextEditorManager();

  var inspirationStory = new Story(inspirationStoryData);
  var inspirationStoryOptions = {
    story: inspirationStory,
    storyContainerElement: $('.inspiration-story'),
    scaleFactor: 0.5,
    editable: false,
    onRenderError: function() { $('.inspiration-story-error').removeClass('hidden'); }
  };
  var inspirationStoryRenderer = new StoryRenderer(inspirationStoryOptions);

  // Temporary fix until version is being added/populated
  if (userStoryData.version === null) {
    userStoryData.version = '';
  }

  // If we're loading an empty story for the first time, add example content
  if ((userStoryData.version === '') && (userStoryData.blocks.length === 0)) {
    userStoryData.blocks = sampleBlocks;
  }

  var userStory = new Story(userStoryData);
  var userStoryOptions = {
    story: userStory,
    storyContainerElement: $('.user-story'),
    editable: true,
    insertionHintElement: $('#story-insertion-hint'),
    textEditorManager: textEditorManager,
    onRenderError: function() {}
  };
  var userStoryRenderer = new StoryRenderer(userStoryOptions);

  inspirationStoryRenderer.render();
  userStoryRenderer.render();


  $('.user-story-container').on('click', '.block-edit-controls-move-up-btn', function(e) {

    var blockId = e.currentTarget.getAttribute('data-block-id');

    if (blockId === null) {
      throw new Error(
        'Element does not have a `data-block-id` attribute: ' +
        e.currentTarget.toString()
      );
    }

    var blockIndex = userStory.getBlockIndexWithId(blockId);

    userStory.swapBlocksAtIndices(blockIndex, blockIndex - 1);
    userStoryRenderer.render();
  });

  $('.user-story-container').on('click', '.block-edit-controls-move-down-btn', function(e) {

    var blockId = e.currentTarget.getAttribute('data-block-id');

    if (blockId === null) {
      throw new Error(
        'Element does not have a `data-block-id` attribute: ' +
        e.currentTarget.toString()
      );
    }

    var blockIndex = userStory.getBlockIndexWithId(blockId);

    userStory.swapBlocksAtIndices(blockIndex, blockIndex + 1);
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
