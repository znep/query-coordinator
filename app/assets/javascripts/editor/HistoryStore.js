;var HistoryStore = (function() {

  'use strict';

  var MAX_UNDO_COUNT = 99;

  function HistoryStore() {

    var self = this;
    var _history = [];
    var _undoCursor = 0;

    window.storyStore.addChangeListener(function() {

      if (window.storyStore.storyExists(window.userStoryUid)) {

        var historyLength = _history.length;
        var newHistoryLength;
        var state = JSON.stringify(
          window.storyStore.serializeStory(window.userStoryUid)
        );

        if (_shouldAppendToHistoryAndTruncateRedo(state)) {

          newHistoryLength = _undoCursor + 1;

          _history.length = newHistoryLength;
          _undoCursor = newHistoryLength;
          _history.push(state);

        } else if (_shouldAppendToHistory(state)) {

          if (historyLength === MAX_UNDO_COUNT) {
            _history.shift();
          }

          _undoCursor = historyLength;
          _history.push(state);
        }

        self._emitChange();
      }
    });

    window.dispatcher.register(function(payload) {

      switch(payload.action) {

        case Constants.HISTORY_UNDO:
          _undo();
          break;

        case Constants.HISTORY_REDO:
          _redo();
          break;

        default:
          break;
      }
    });

    _.extend(self, new Store());

    /**
     * Public methods
     */

    this.canUndo = function() {
      return (_undoCursor > 0);
    };

    this.canRedo = function() {
      return ((_history.length - 1) > _undoCursor);
    };

    /**
     * Private methods
     */

    function _shouldAppendToHistoryAndTruncateRedo(state) {

      var historyLength = _history.length;

      return (
        historyLength > 0 &&
        _undoCursor < historyLength - 1 &&
        _history[_undoCursor] !== state &&
        _history[_undoCursor + 1] !== state
      );
    }

    function _shouldAppendToHistory(state) {

      var historyLength = _history.length;

      return (
        historyLength === 0 ||
        _history[historyLength - 1] !== state &&
        _history[_undoCursor] !== state
      );
    }

    function _undo() {

      if (self.canUndo()) {

        _undoCursor--;

        window.storyStore.deserializeStory(
          JSON.parse(_history[_undoCursor])
        );

        self._emitChange();
      }
    };

    function _redo() {

      if (self.canRedo()) {

        _undoCursor++;

        window.storyStore.deserializeStory(
          JSON.parse(_history[_undoCursor])
        );

        self._emitChange();
      }
    };
  }

  return HistoryStore;
})();
