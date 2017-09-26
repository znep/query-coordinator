import _ from 'lodash';

import Constants from './Constants';
import { assertIsOneOfTypes } from 'common/js_utils';
import { storySaveStatusStore } from './stores/StorySaveStatusStore';
import { storyStore } from './stores/StoryStore';
import { userSessionStore } from './stores/UserSessionStore';
import StoryDraftCreator from './StoryDraftCreator';

export default function Autosave(storyUid) {
  assertIsOneOfTypes(Constants.AUTOSAVE_DEBOUNCE_TIME_IN_SECONDS, 'number');

  var autosaveDebounceMsec = Constants.AUTOSAVE_DEBOUNCE_TIME_IN_SECONDS * 1000;
  var disabled = storySaveStatusStore.autosaveDisabled();
  var autosaveLock = false;
  var saveOnceSettled;

  function saveASAP() {
    if (disabled || !storySaveStatusStore.isStorySavePossible()) {
      // Give up.
      return;
    }

    if (storySaveStatusStore.isStorySaveInProgress() || autosaveLock) {
      // Try again in a bit.
      saveOnceSettled();
      return;
    }

    // Ensure that only one autosave invocation is running at a time.
    autosaveLock = true;

    // Make up to three attempts to save the story, then give up.
    var savePromise = Promise.reject();
    var createRetryDelay = function(error) {
      return new Promise(function(resolve, reject) {
        setTimeout(reject.bind(null, error), autosaveDebounceMsec);
      });
    };
    for (var attempt = 1, limit = 3; attempt <= limit; attempt++) {
      savePromise = savePromise.catch(function() {
        return StoryDraftCreator.saveDraft(storyUid);
      }).catch(createRetryDelay);
    }
    savePromise.catch(function(error) {
      // If this case is reached, it implies either that the user's session has
      // been lost or that another user has edited the story and poisoned the
      // local state. Abort all further autosave invocations until either the
      // user session has been restored (see below) or the user reloads the page
      // for a fresh local state.
      disabled = true;
      console.error(
        'Autosave failed due to conflicting edits or missing user session.',
        error
      );
    }).then(function() {
      // Release the lock so that a new autosave invocation can proceed.
      autosaveLock = false;
    });
  }

  saveOnceSettled = _.debounce(saveASAP, autosaveDebounceMsec);

  /**
   * Subscriptions to stores and global events
   */

  function onReconnect() {
    // When the user session is re-established, reset the disabled flag and
    // trigger autosave.
    if (userSessionStore.hasValidSession()) {
      disabled = storySaveStatusStore.autosaveDisabled();
      saveOnceSettled();
    }
  }

  storyStore.addChangeListener(saveOnceSettled);

  userSessionStore.addChangeListener(onReconnect);
  window.addEventListener('online', onReconnect);

  // NOTE: This method was previously exposed so that other components could
  // trigger a save; however, changes to autosave behavior may have caused this
  // capability to be unnecessary for other components.
  // this.saveASAP = saveASAP;
}
