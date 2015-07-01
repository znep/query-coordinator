;(function() {
  function DragDropStore() {
    var self = this;

    var _reorderHintPosition = null;

    _.extend(this, new Store());

    window.dispatcher.register(function(payload) {
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
      Util.assertHasProperties(payload, 'storyUid', 'blockId');

      if (window.storyStore.storyExists(payload.storyUid)) {
        var dropIndex = _.indexOf(
          window.storyStore.getBlockIds(payload.storyUid),
          payload.blockId);

        if (dropIndex >= 0) {
          _setReorderHintPosition({
            storyUid: payload.storyUid,
            dropIndex: dropIndex
          });
        } else {
          _setReorderHintPosition(null);
        }
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
      Util.assertHasProperties(payload, 'storyUid');
      Util.assertHasProperties(payload, 'blockId');

      if (self.isDraggingOverStory(payload.storyUid)) {
        var hintPosition = self.getReorderHintPosition();

        _setReorderHintPosition(null);

        dispatcher.dispatch({
          action: Constants.BLOCK_COPY_INTO_STORY,
          blockId: payload.blockId,
          storyUid: payload.storyUid,
          insertAt: hintPosition.dropIndex
        });
        self._emitChange();
      }
    }

  };

  window.DragDropStore = DragDropStore;
}());
