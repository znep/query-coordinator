import _ from 'lodash';

import Constants from './Constants';
import StorytellerUtils from '../StorytellerUtils';
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
  StorytellerUtils.assertIsOneOfTypes(Constants.AUTOSAVE_DEBOUNCE_TIME_IN_SECONDS, 'number');

  var autosaveDebounceMsec = Constants.AUTOSAVE_DEBOUNCE_TIME_IN_SECONDS * 1000;
  var saveOnceSettled;

  // Autosave can be disabled from a URL parameter: autosave.
  // For example: https://example.com?autosave=false
  var disabledByUrlParam = StorytellerUtils.queryParameters().some(function(parameter) {
    return parameter[0] === 'autosave' && parameter[1] === 'false';
  });

  function saveASAP() {
    if (disabledByUrlParam) {
      return;
    }

    if (savingRightNow) {
      saveOnceSettled(); // Try again in a bit.
    } else {
      if (storySaveStatusStore.isStorySavePossible()) {
        savingRightNow = true;
        StoryDraftCreator.saveDraft(storyUid).then(
          clearSavingFlag, // success
          function(error) {
            // error
            clearSavingFlag();
            saveOnceSettled(); // try again
            exceptionNotifier.notify(error);
          });
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
