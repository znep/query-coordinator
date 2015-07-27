;(function(namespace) {
  'use strict';

  function DragDropStore() {
    var self = this;
    var Util = namespace.Util;
    var dispatcher = namespace.dispatcher;

    var _reorderHintPosition = null;

    _.extend(this, new namespace.Store());

    namespace.dispatcher.register(function(payload) {
      switch(payload.action) {
        case Constants.STORY_DRAG_OVER:
          _storyDragOver(payload);
          break;
        case Constants.STORY_DRAG_LEAVE:
          _storyDragLeave(payload);
          break;
        case Constants.STORY_DROP:
          _storyDrop(payload);
          break;
      }
    });

    /**
     * Returns where the reorder hint should be.
     *
     * Returns null, or:
     * {
     *   storyUid: Uid of story that should be hinted.
     *   dropIndex: Index to hint.
     * }
     */
    this.getReorderHintPosition = function() {
      return _reorderHintPosition;
    };

    this.isDraggingOverStory = function(storyUid) {
      var position = this.getReorderHintPosition();

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
      Util.assertHasProperties(payload, 'storyUid', 'pointer', 'storyElement');

      if (namespace.storyStore.storyExists(payload.storyUid)) {
        var dropIndex;

        var pointerY = Unipointer.getPointerPoint(payload.pointer).y - window.scrollY;

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
      Util.assertHasProperties(payload, 'storyUid');

      if (_reorderHintPosition && _reorderHintPosition.storyUid === payload.storyUid) {
        _setReorderHintPosition(null);
      }
    }

    function _storyDrop(payload) {
      Util.assertHasProperties(payload, 'storyUid', 'blockContent');

      if (self.isDraggingOverStory(payload.storyUid)) {
        var hintPosition = self.getReorderHintPosition();

        _setReorderHintPosition(null);

        dispatcher.dispatch({
          action: Constants.STORY_INSERT_BLOCK,
          blockContent: payload.blockContent,
          storyUid: payload.storyUid,
          insertAt: hintPosition.dropIndex
        });
        self._emitChange();
      }
    }

  }

  namespace.DragDropStore = DragDropStore;
}(window.socrata.storyteller));
