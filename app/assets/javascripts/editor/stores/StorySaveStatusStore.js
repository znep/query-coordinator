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

    var _lastSavedSerializedStory = null;
    var _saveInProgress = false;
    // If a conflict ever happens, disable save for the entire life of this page :(
    var _poisonedWithSaveConflictForever = false;

    _.extend(this, new storyteller.Store());

    utils.assertIsOneOfTypes(forStoryUid, 'string');
    utils.assert(storyteller.storyStore, 'StoryStore must be initialized before StorySaveStatusStore');

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Constants.STORY_CREATE:
        case Constants.STORY_SAVED:
          // Story load.
          // Let StoryStore deal with this action, then remember the initial story state.
          storyteller.dispatcher.waitFor([ storyteller.storyStore.getDispatcherToken() ]);
          _lastSavedSerializedStory = storyteller.storyStore.serializeStory(forStoryUid);
          _saveInProgress = false;
          self._emitChange();
          break;

        case Constants.STORY_SAVE_ERROR:
          _saveInProgress = false;
          _poisonedWithSaveConflictForever = _poisonedWithSaveConflictForever || payload.conflict;
          self._emitChange();
        break;

        case Constants.STORY_SAVE_STARTED:
          _saveInProgress = true;
          self._emitChange();
        break;
      }

    });

    storyteller.storyStore.addChangeListener(function() {
      storyteller.dispatcher.waitFor([ storyteller.historyStore.getDispatcherToken() ]);
      self._emitChange();
    });

    /**
     * Public methods
     */

    self.isStorySaved = function() {
      var newSerializedStory = storyteller.storyStore.serializeStory(forStoryUid);
      return _.isEqual(newSerializedStory, _lastSavedSerializedStory);
    };

    self.isStorySaveInProgress = function() {
      return _saveInProgress;
    };

    self.isSaveImpossibleDueToConflict = function() {
      return _poisonedWithSaveConflictForever;
    };
  }

  root.socrata.storyteller.StorySaveStatusStore = StorySaveStatusStore;
})(window);

