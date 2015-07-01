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
    if (!handles.hasOwnProperty('length')) {
      throw new Error('`handles` argument must be an array-like');
    }

    if (ghostElement.length != 1) {
      throw new Error('`ghostElement` argument must point to exactly one element');
    }

    var self = this;

    var _draggedBlockId = null;

    // TODO calculate from mouse down location.
    var _ghostCursorOffset = 0;

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

    this.dragEnd = function(event, pointer) {

      var storyUidOver = $(pointer.target).closest('.story').attr('data-story-uid');

      var dragged = _draggedBlockId;

      $('body').removeClass('dragging');
      _draggedBlockId = null;
      ghostElement.addClass('hidden');

      dispatcher.dispatch({
        action: Constants.STORY_DROP,
        blockId: dragged,
        storyUid: storyUidOver
      });
    };

    this.setup = function() {
      this.bindHandles();
    };

  };


  DragDrop.prototype = Unidragger.prototype;

  window.DragDrop = DragDrop;

})();
