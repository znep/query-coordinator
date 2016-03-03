(function() {

  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;
  var savingRightNow = false;

  function clearSavingFlag() {
    savingRightNow = false;
  }

  function Autosave(storyUid) {
    utils.assertIsOneOfTypes(storyteller.config.autosaveDebounceTimeInSeconds, 'number');

    var autosaveDebounceMsec = storyteller.config.autosaveDebounceTimeInSeconds * 1000;
    var saveOnceSettled;

    // Autosave can be disabled from a URL parameter: autosave.
    // For example: https://example.com?autosave=false
    var disabledByUrlParam = utils.queryParameters().some(function(parameter) {
      return parameter[0] === 'autosave' && parameter[1] === 'false';
    });

    function saveASAP() {
      if (disabledByUrlParam) {
        return;
      }

      if (savingRightNow) {
        saveOnceSettled(); // Try again in a bit.
      } else {
        if (storyteller.storySaveStatusStore.isStorySavePossible()) {
          savingRightNow = true;
          storyteller.StoryDraftCreator.saveDraft(storyUid).then(
            clearSavingFlag, // success
            function(error) {
              // error
              clearSavingFlag();
              saveOnceSettled(); // try again
              storyteller.airbrake.notify(error);
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

    storyteller.storyStore.addChangeListener(saveOnceSettled);
    storyteller.userSessionStore.addChangeListener(function() {
      // When the session is re-established, trigger autosave
      if (storyteller.userSessionStore.hasValidSession()) {
        saveOnceSettled();
      }
    });

    this.saveASAP = saveASAP;
  }

  storyteller.Autosave = Autosave;

})();
