(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function HistoryStore() {

    _.extend(this, new storyteller.Store());

    var self = this;
    var _history = [];
    var _undoCursor = 0;

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Constants.HISTORY_UNDO:
          _undo();
          break;

        case Constants.HISTORY_REDO:
          _redo();
          break;
      }
    });

    storyteller.storyStore.addChangeListener(function() {

      if (storyteller.storyStore.storyExists(storyteller.userStoryUid)) {

        var historyLength = _history.length;
        var newHistoryLength;
        var serializedStory = JSON.stringify(
          storyteller.storyStore.serializeStory(storyteller.userStoryUid)
        );

        // This is the case when one or more undo operations have
        // taken place and then content that does not match the next
        // redo content is applied. This should cause the history of
        // serializedStories following the current undo cursor to be
        // truncated.
        if (_shouldAppendToHistoryAndTruncateRedo(serializedStory)) {

          newHistoryLength = _undoCursor + 1;

          _history.length = newHistoryLength;
          _undoCursor = newHistoryLength;
          _history.push(serializedStory);

        // This is the case where we are already at the end of the
        // history array so we just append to it.
        } else if (_shouldAppendToHistory(serializedStory)) {

          if (historyLength === Constants.HISTORY_MAX_UNDO_COUNT) {
            _history.shift();
          }

          _undoCursor = historyLength;
          _history.push(serializedStory);
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

    this.getStateAtCursor = function() {
      return _history[_undoCursor];
    };

    /**
     * Private methods
     */

    function _shouldAppendToHistoryAndTruncateRedo(serializedStory) {

      var historyLength = _history.length;

      utils.assertIsOneOfTypes(serializedStory, 'string');

      return (
        historyLength > 0 &&
        _undoCursor < historyLength - 1 &&
        _history[_undoCursor] !== serializedStory &&
        _history[_undoCursor + 1] !== serializedStory
      );
    }

    function _shouldAppendToHistory(serializedStory) {

      var historyLength = _history.length;

      utils.assertIsOneOfTypes(serializedStory, 'string');

      return (
        historyLength === 0 ||
        _history[historyLength - 1] !== serializedStory &&
        _history[_undoCursor] !== serializedStory
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
