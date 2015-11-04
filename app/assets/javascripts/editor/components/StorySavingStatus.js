/*
 * A button that allows the user to save a story. Displays progress.
 */
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  $.fn.storySavingStatus = function(options) {
    var $this = $(this);
    var holdInSavedState = false; // We need to keep displaying 'Saved!' for a bit.
    var clearHoldInSaveStateAfterDebounce;

    utils.assert(storyteller.storySaveStatusStore, 'storySaveStatusStore must be instantiated');
    utils.assertIsOneOfTypes(options, 'object', 'undefined');

    options = _.extend({}, { savedMessageTimeout: 5000 }, options);

    // Stay in holdInSavedState until things settle down for the configured timeout.
    clearHoldInSaveStateAfterDebounce = _.debounce(function() {
      if (holdInSavedState) {
        holdInSavedState = false;
        render();
      }
    }, options.savedMessageTimeout);


    function render() {
      var isStorySaved = !storyteller.storySaveStatusStore.isStoryDirty();
      var isStorySaveInProgress = storyteller.storySaveStatusStore.isStorySaveInProgress();
      var isSaveImpossible = storyteller.storySaveStatusStore.isSaveImpossibleDueToConflict();
      var buttonState;

      clearHoldInSaveStateAfterDebounce();

      if (isSaveImpossible) {
        buttonState = Constants.SAVE_BUTTON_STATE_IDLE;
      } else if (isStorySaveInProgress) {
        buttonState = Constants.SAVE_BUTTON_STATE_SAVING;
      } else if (isStorySaved) {
        if (holdInSavedState) {
          buttonState = Constants.SAVE_BUTTON_STATE_SAVED;
        } else {
          buttonState = Constants.SAVE_BUTTON_STATE_IDLE;
        }
      } else {
        buttonState = Constants.SAVE_BUTTON_STATE_UNSAVED;
      }

      if (buttonState === Constants.SAVE_BUTTON_STATE_IDLE
          || buttonState === Constants.SAVE_BUTTON_STATE_UNSAVED) {
        $this.hide();
      } else {
        $this.show();
        $this.text(I18n.t('editor.story_save_button.{0}'.format(buttonState)));
        $this.prop('disabled', isStorySaveInProgress || isStorySaved || isSaveImpossible);
      }
    }

    storyteller.storySaveStatusStore.addChangeListener(function() {
      holdInSavedState = !storyteller.storySaveStatusStore.isStoryDirty();
      render();
    });
    render();

    return this;
  };

}(jQuery, window));
