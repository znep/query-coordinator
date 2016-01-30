(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  /**
   * A store that maintains a story's edit history.
   *
   * @param {string} forStoryUid - The UID of the story to track.
   */
  function HistoryStore(forStoryUid) {

    utils.assertIsOneOfTypes(forStoryUid, 'string');

    _.extend(this, new storyteller.Store());

    var self = this;
    var _history = [];
    var _undoCursor = 0;

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Actions.HISTORY_UNDO:
          _undo();
          break;

        case Actions.HISTORY_REDO:
          _redo();
          break;
      }
    });

    storyteller.storyStore.addChangeListener(function() {

      if (storyteller.storyStore.storyExists(forStoryUid)) {

        var historyLength = _history.length;
        var newHistoryLength;
        var storySnapshot = storyteller.storyStore.snapshotContents(forStoryUid);

        // This is the case when one or more undo operations have
        // taken place and then content that does not match the next
        // redo content is applied. This should cause the history of
        // serializedStories following the current undo cursor to be
        // truncated.
        if (_shouldAppendToHistoryAndTruncateRedo(storySnapshot)) {

          newHistoryLength = _undoCursor + 1;

          _history.length = newHistoryLength;
          _undoCursor = newHistoryLength;
          _history.push(storySnapshot);

        // This is the case where we are already at the end of the
        // history array so we just append to it.
        } else if (_shouldAppendToHistory(storySnapshot)) {

          if (historyLength === Constants.HISTORY_MAX_UNDO_COUNT) {
            _history.shift();
          }

          _undoCursor = historyLength;
          _history.push(storySnapshot);
        }

        self._emitChange();
      }
    });

    /**
     * Public methods
     */

    this.canUndo = function() {
      return (_undoCursor > 0);
    };

    this.canRedo = function() {
      return ((_history.length - 1) > _undoCursor);
    };

    this.getStorySnapshotAtCursor = function() {
      return _history[_undoCursor];
    };

    /**
     * Private methods
     */

    function _shouldAppendToHistoryAndTruncateRedo(storySnapshot) {

      var historyLength = _history.length;

      utils.assertIsOneOfTypes(storySnapshot, 'object');

      return (
        historyLength > 0 &&
        _undoCursor < historyLength - 1 &&
        !_.isEqual(_history[_undoCursor], storySnapshot) &&
        !_.isEqual(_history[_undoCursor + 1], storySnapshot)
      );
    }

    function _shouldAppendToHistory(storySnapshot) {

      var historyLength = _history.length;

      utils.assertIsOneOfTypes(storySnapshot, 'object');

      return (
        historyLength === 0 ||
        !_.isEqual(_history[_undoCursor - 1], storySnapshot) &&
        !_.isEqual(_history[_undoCursor], storySnapshot)
      );
    }

    function _undo() {
      if (self.canUndo()) {
        _undoCursor--;
      }
    }

    function _redo() {
      if (self.canRedo()) {
        _undoCursor++;
      }
    }
  }

  root.socrata.storyteller.HistoryStore = HistoryStore;
})(window);
