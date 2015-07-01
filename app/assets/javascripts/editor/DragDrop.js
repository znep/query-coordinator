;(function() {
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

    this.setup = function() {
      this.bindHandles();

      // TODO this doesn't belong here.
      window.dragDropStore.addChangeListener(function() {
        if (window.dragDropStore.isDraggingOverStory(userStoryUid)) {
          ghostElement.addClass('full-size');
        } else {
          ghostElement.removeClass('full-size');
        }
      });
    };

  };


  DragDrop.prototype = Unidragger.prototype;

  window.DragDrop = DragDrop;

})();
