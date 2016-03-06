import $ from 'jQuery';
import Unidragger from 'unidragger';

import Actions from './Actions';
import StorytellerUtils from '../StorytellerUtils';
import { dispatcher } from './Dispatcher';
import { dropHintStore } from './stores/DropHintStore';

/*
 * Responsible for:
 *  - Providing STORY_DRAG_OVER, STORY_DRAG_LEAVE, and STORY_DROP
 *    actions.
 *  - Providing a ghost visual that follows the pointer.
 *
 *  @constructor
 *  @param {Object} handles - An array of block elements that can be dragged.
 *  @param {Object} ghostElement - The DOM node to manage as the ghost visual.
 *                                 All contents will be replaced.
 */
export default function DragDrop(handles, ghostElement) {

  StorytellerUtils.assertHasProperty(handles, 'length');
  StorytellerUtils.assert(
    ghostElement.length === 1,
    '`ghostElement` argument must point to exactly one element'
  );

  var _blockContent = null;

  // TODO calculate from mouse down location.
  var _ghostCursorOffset = 0;
  var _actualDragStartTarget;
  var _storyUidDraggedOver;

  this.handles = handles; // Needed for unidragger integration.

  this.setup = function() {
    this.bindHandles(); //function from unidragger
  };

  this.pointerDown = function(event, pointer) {
    // Since the Unidragger library does not track the element that was under
    // the mouse when the drag began, but rather reports the element under the
    // mouse when the distance threshold to initiate the drag action is exceeded,
    // we can sometimes end up with no idea which sample block the user actually
    // clicked on as by the time Unidragger recognizes the drag event the cursor
    // is over the panel containing the inspiration blocks instead.
    //
    // Our solution here is to track what element was under the pointer when the
    // mouse was clicked or the screen was touched.
    _actualDragStartTarget = pointer.target;
    // Call the 'super', since we are overriding this method.
    Unidragger.prototype.pointerDown.apply(this, arguments);
  };

  this.pointerUp = function() {
    _actualDragStartTarget = null;
    // Call the 'super', since we are overriding this method.
    Unidragger.prototype.pointerUp.apply(this, arguments);
  };

  this.dragStart = function() {
    var sourceBlockElement;

    _storyUidDraggedOver = undefined;

    if (_actualDragStartTarget) {
      $('body').addClass('dragging');

      sourceBlockElement = $(_actualDragStartTarget).closest('[data-block-content]');

      _blockContent = JSON.parse(sourceBlockElement.attr('data-block-content'));

      $('.component-blinder').removeClass('hidden');

      ghostElement.
        removeClass('hidden').
        empty().
        append(sourceBlockElement.clone());
    }
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
          action: Actions.STORY_DRAG_LEAVE,
          storyUid: _storyUidDraggedOver
        });
        _storyUidDraggedOver = undefined;
      }

      if (storyUidOver) {
        _storyUidDraggedOver = storyUidOver;
      }
    }

    if (_storyUidDraggedOver) {
      dispatcher.dispatch({
        action: Actions.STORY_DRAG_OVER,
        storyUid: _storyUidDraggedOver,
        blockContent: _blockContent,
        pointer: pointer,
        storyElement: storyOver[0]
      });
    }

    ghostElement.
      css({
        left: this.dragStartPoint.x + moveVector.x - _ghostCursorOffset - window.pageXOffset,
        top: this.dragStartPoint.y + moveVector.y - _ghostCursorOffset - window.pageYOffset
      });
  };

  this.dragEnd = function(event, pointer) {
    var storyUidOver = $(pointer.target).closest('[data-story-uid]').attr('data-story-uid');
    var blockContent = _blockContent;

    $('body').removeClass('dragging');
    _blockContent = null;

    $('.component-blinder').addClass('hidden');
    ghostElement.addClass('hidden');

    if (storyUidOver) {
      if (dropHintStore.isDraggingOverStory(storyUidOver)) {
        var hintPosition = dropHintStore.getDropHintPosition();

        dispatcher.dispatch({
          action: Actions.STORY_INSERT_BLOCK,
          blockContent: blockContent,
          storyUid: storyUidOver,
          insertAt: hintPosition.dropIndex
        });
      }

      dispatcher.dispatch({
        action: Actions.STORY_DROP,
        storyUid: storyUidOver
      });
    }
  };
}

DragDrop.prototype = Unidragger.prototype;
