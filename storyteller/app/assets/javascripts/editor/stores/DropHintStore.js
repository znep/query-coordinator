import $ from 'jquery';
import _ from 'lodash';
import Unipointer from 'unipointer';

import Store from './Store';
import Actions from '../Actions';
import { assertHasProperty, assertHasProperties } from 'common/js_utils';
import { storyStore } from './StoryStore';

export var dropHintStore = new DropHintStore();
export default function DropHintStore() {

  _.extend(this, new Store());

  var self = this;
  var _reorderHintPosition = null;

  this.register(function(payload) {
    switch (payload.action) {
      case Actions.STORY_DRAG_OVER:
        _storyDragOver(payload);
        break;
      case Actions.STORY_DRAG_LEAVE:
        _storyDragLeave(payload);
        break;
      case Actions.STORY_DROP:
        _storyDrop(payload);
        break;
    }
  });

  /**
   * Returns where the drop hint should be.
   *
   * Returns null, or:
   * {
   *   storyUid: Uid of story that should be hinted.
   *   dropIndex: Index to hint.
   * }
   */
  this.getDropHintPosition = function() {
    return _reorderHintPosition;
  };

  this.isDraggingOverStory = function(storyUid) {
    var position = this.getDropHintPosition();

    return !!(position && position.storyUid === storyUid);
  };

  function _setReorderHintPosition(position) {
    if (position !== _reorderHintPosition) {
      _reorderHintPosition = position;
      self._emitChange();
    }
  }

  /*
   * Action handlers
   */

  function _storyDragOver(payload) {
    assertHasProperties(payload, 'storyUid', 'pointer', 'storyElement');

    if (storyStore.doesStoryExist(payload.storyUid)) {
      var dropIndex;

      var pointerY = Unipointer.getPointerPoint(payload.pointer).y - window.pageYOffset;

      // _.chain allows you to chain lodash calls together, vs. having to nest individual
      // calls.
      var blocksSortedByVerticalPosition = _.chain($(payload.storyElement).find('.block')).
        map(function(block) { return block.getBoundingClientRect(); }).
        sortBy('top').
        value();

      // From the bottom, give me first block where the top extent
      // is above the pointer. This is the block we're over.
      var indexOfBlockUnderPointer = _.findLastIndex(
        blocksSortedByVerticalPosition,
        function(rect) {
          return rect.top <= pointerY;
        });

      if (indexOfBlockUnderPointer >= 0) {
        var blockExtents = blocksSortedByVerticalPosition[indexOfBlockUnderPointer];
        var height = blockExtents.bottom - blockExtents.top;
        var isOverBottomHalf = pointerY >= blockExtents.top + (height / 2);

        dropIndex = indexOfBlockUnderPointer + (isOverBottomHalf ? 1 : 0);
      } else {
        dropIndex = 0;
      }

      _setReorderHintPosition({
        storyUid: payload.storyUid,
        dropIndex: dropIndex
      });
    } else {
      _setReorderHintPosition(null);
    }
  }

  function _storyDragLeave(payload) {
    assertHasProperties(payload, 'storyUid');

    if (_reorderHintPosition && _reorderHintPosition.storyUid === payload.storyUid) {
      _setReorderHintPosition(null);
    }
  }

  function _storyDrop(payload) {
    assertHasProperty(payload, 'storyUid');

    if (self.isDraggingOverStory(payload.storyUid)) {
      _setReorderHintPosition(null);
    }
  }

}
