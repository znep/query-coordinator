import _ from 'lodash';

import Store from './Store';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { storyStore } from './StoryStore';
import httpRequest from '../../services/httpRequest';
import { exceptionNotifier } from '../../services/ExceptionNotifier';

export var storySaveStatusStore = StorytellerUtils.export(
  new StorySaveStatusStore(Environment.STORY_UID),
  'storyteller.storySaveStatusStore'
);

/**
 * A store that indicates a story's save status (saved, unsaved, etc).
 *
 * @param {string} forStoryUid - The UID of the story to track.
 */
export default function StorySaveStatusStore(forStoryUid) {
  var self = this;
  var _lastSerializedStory = null;
  var _saveInProgress = false;
  // If a conflict ever happens, disable save for the entire life of this page :(
  var _poisonedWithSaveConflictForever = false;
  var _userCausingConflict = null;
  var _lastSaveError = null;

  _.extend(this, new Store());

  StorytellerUtils.assertIsOneOfTypes(forStoryUid, 'string');
  StorytellerUtils.assert(storyStore, 'StoryStore must be initialized before StorySaveStatusStore');

  this.register(function(payload) {
    var action = payload.action;
    var userUrl;

    switch (action) {

      case Actions.STORY_CREATE:
        _lastSerializedStory = storyStore.serializeStory(forStoryUid);
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

        if (payload.conflict) {

          userUrl = StorytellerUtils.format('/api/users/{0}.json', payload.conflictingUserId);

          httpRequest('GET', userUrl).
            then(
              function(userData) {

                _userCausingConflict = userData;
                self._emitChange();
              }
            ).
            catch(exceptionNotifier.notify);
        }
        break;

      case Actions.STORY_SAVE_STARTED:
        StorytellerUtils.assert(_saveInProgress === false, 'Can only have one pending save at a time.');

        _lastSerializedStory = storyStore.serializeStory(forStoryUid);
        _saveInProgress = true;

        self._emitChange();
        break;
    }

  });

  storyStore.addChangeListener(function() {
    self._emitChange();
  });

  function _storySavedSuccessfully() {
    // Let StoryStore deal with this action, then remember the initial or updated story state.
    dispatcher.waitFor([ storyStore.getDispatcherToken() ]);
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
    var currentSerializedStory = storyStore.serializeStory(forStoryUid);
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

  // Return details of the user causing the conflict.
  // Note that this is not guaranteed to return
  // non-null even if isSaveImpossibleDueToConflict() returns
  // true, as fetching this info is an async operation and may
  // take a while to complete.
  // The format is a coreserver user blob.
  self.userCausingConflict = function() {
    return _userCausingConflict;
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
