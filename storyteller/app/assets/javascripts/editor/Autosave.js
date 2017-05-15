import _ from 'lodash';

import Constants from './Constants';
import { assertIsOneOfTypes } from 'common/js_utils';
import Environment from '../StorytellerEnvironment';
import { storySaveStatusStore } from './stores/StorySaveStatusStore';
import { storyStore } from './stores/StoryStore';
import { userSessionStore } from './stores/UserSessionStore';
import { exceptionNotifier } from '../services/ExceptionNotifier';
import StoryDraftCreator from './StoryDraftCreator';

var savingRightNow = false;

function clearSavingFlag() {
  savingRightNow = false;
}

export var autosave = new Autosave(Environment.STORY_UID);
export default function Autosave(storyUid) {
  assertIsOneOfTypes(Constants.AUTOSAVE_DEBOUNCE_TIME_IN_SECONDS, 'number');

  var autosaveDebounceMsec = Constants.AUTOSAVE_DEBOUNCE_TIME_IN_SECONDS * 1000;
  var saveOnceSettled;
  var disabled = storySaveStatusStore.autosaveDisabled();

  function saveASAP() {
    if (disabled) {
      return;
    }

    if (savingRightNow) {
      saveOnceSettled(); // Try again in a bit.
    } else {

      if (storySaveStatusStore.isStorySavePossible()) {

        savingRightNow = true;

        StoryDraftCreator.
          saveDraft(storyUid).
          then(
            clearSavingFlag, // success
            function(error) {

              clearSavingFlag();
              saveOnceSettled(); // try again
              exceptionNotifier.notify(error);
            }
          );
      }
    }
  }

  // A function that saves the story
  // once this function (saveOnceSettled) stops
  // being called for autosaveDebounceMsec.
  saveOnceSettled = _.debounce(
    saveASAP,
    autosaveDebounceMsec
  );

  storyStore.addChangeListener(saveOnceSettled);
  userSessionStore.addChangeListener(function() {
    // When the session is re-established, trigger autosave
    if (userSessionStore.hasValidSession()) {
      saveOnceSettled();
    }
  });

  this.saveASAP = saveASAP;
}
