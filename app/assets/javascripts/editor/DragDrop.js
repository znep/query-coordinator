;(function() {
  'use strict';

  /*
   * Responsible for:
   *  - Providing STORY_DRAG_ENTER, STORY_DRAG_OVER, STORY_DRAG_LEAVE, and STORY_DROP
   *    actions.
   *  - Providing a ghost visual that follows the pointer.
   *
   *  @constructor
   *  @param {Object} handles - An array of block elements that can be dragged.
   *  @param {Object} ghostElement - The DOM node to manage as the ghost visual.
   *                                 All contents will be replaced.
   */
  function DragDrop(handles, ghostElement) {
    if (!handles.hasOwnProperty('length')) {
      throw new Error('`handles` argument must be an array-like');
    }

    if (ghostElement.length != 1) {
      throw new Error('`ghostElement` argument must point to exactly one element');
    }

    var _draggedBlockId = null;

    // TODO calculate from mouse down location.
    var _ghostCursorOffset = 0;

    var _storyUidDraggedOver = undefined;

    this.handles = handles; // Needed for unidragger integration.

    this.dragStart = function(event, pointer) {
      var sourceBlockElement;
      var sourceBlockHtml;

      _storyUidDraggedOver = undefined;
      $('body').addClass('dragging');

      sourceBlockElement = $(pointer.target).parent('.block');

      _draggedBlockId = sourceBlockElement.attr('data-block-id');

      sourceBlockHtml = sourceBlockElement.html();

      ghostElement.
        html(sourceBlockHtml).
        removeClass('hidden');
    };

    this.dragMove = function(event, pointer, moveVector) {
      var target = $(pointer.target);
      var storyOver = target.closest('.story');

      // Hack for insertion hint.
      // The insertion hint is not a direct child of the story container.
      // To obtain its associated storyUid, we must search the siblings
      // of the insertion hint for a story DOM.
      if (storyOver.length === 0 && target.attr('id') === 'story-insertion-hint') {
        storyOver = target.parent().children('.story');
      }

      var storyUidOver = storyOver.attr('data-story-uid');

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
          draggedBlockId: _draggedBlockId,
          pointer: pointer,
          storyElement: storyOver[0]
        });
      }

      ghostElement.
        css({
          left: this.dragStartPoint.x + moveVector.x - _ghostCursorOffset,
          top: this.dragStartPoint.y + moveVector.y - _ghostCursorOffset
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
