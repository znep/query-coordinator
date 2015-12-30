(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  /**
   * A store that indicates a story's save status (saved, unsaved, etc).
   *
   * @param {string} forStoryUid - The UID of the story to track.
   */
  function StorySaveStatusStore(forStoryUid) {

    var self = this;

    var _lastSerializedStory = null;
    var _saveInProgress = false;
    // If a conflict ever happens, disable save for the entire life of this page :(
    var _poisonedWithSaveConflictForever = false;
    var _lastSaveError = null;

    _.extend(this, new storyteller.Store());

    utils.assertIsOneOfTypes(forStoryUid, 'string');
    utils.assert(storyteller.storyStore, 'StoryStore must be initialized before StorySaveStatusStore');

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Actions.STORY_CREATE:
          _lastSerializedStory = storyteller.storyStore.serializeStory(forStoryUid);
          _storySavedSuccessfully();
          break;

        case Actions.STORY_SAVED:
          _storySavedSuccessfully();
          break;

        case Actions.STORY_SAVE_FAILED:
          _saveInProgress = false;
          _poisonedWithSaveConflictForever = _poisonedWithSaveConflictForever || payload.conflict;
          _lastSaveError = {
            conflict: payload.conflict
          };
          self._emitChange();
          break;

        case Actions.STORY_SAVE_STARTED:
          if (_saveInProgress) {
            throw new Error('Can only have one pending save at a time.');
          }
          _lastSerializedStory = storyteller.storyStore.serializeStory(forStoryUid);
          _saveInProgress = true;
          _lastSaveError = null;
          self._emitChange();
          break;
      }

    });

    storyteller.storyStore.addChangeListener(function() {
      storyteller.dispatcher.waitFor([ storyteller.historyStore.getDispatcherToken() ]);
      self._emitChange();
    });

    function _storySavedSuccessfully() {
      // Let StoryStore deal with this action, then remember the initial or updated story state.
      storyteller.dispatcher.waitFor([ storyteller.storyStore.getDispatcherToken() ]);
      _saveInProgress = false;
      _lastSaveError = null;
      self._emitChange();
    }

    /**
     * Public methods
     */

    self.isStoryDirty = function() {
      // Metadata properties are saved through a different mechanism, so the save button
      // should not light up for changes _only_ to the metadata.
      var metadataProperties = [ 'title', 'description' ];
      var currentSerializedStory = storyteller.storyStore.serializeStory(forStoryUid);
      return self.isStorySaveInProgress() || !!_lastSaveError || !_.isEqual(
        _.omit(currentSerializedStory, metadataProperties),
        _.omit(_lastSerializedStory, metadataProperties)
      );
    };

    self.isStorySaveInProgress = function() {
      return _saveInProgress;
    };

    self.isSaveImpossibleDueToConflict = function() {
      return _poisonedWithSaveConflictForever;
    };

    self.isStorySavePossible = function() {
      var isStorySaved = !self.isStoryDirty();
      var isStorySaveInProgress = self.isStorySaveInProgress();
      var isSaveImpossible = self.isSaveImpossibleDueToConflict();

      return (!(isStorySaveInProgress || isStorySaved || isSaveImpossible));
    };

    /**
     * Returns the last save error, if any. The error is cleared when
     * a new save is started.
     *
     * @typedef {Object} SaveError
     * @property {boolean} conflict - whether or not there was a save conflict.
     *
     * @return {SaveError | null}
     */
    self.lastSaveError = function() {
      return _lastSaveError;
    };
  }

  root.socrata.storyteller.StorySaveStatusStore = StorySaveStatusStore;
})(window);

