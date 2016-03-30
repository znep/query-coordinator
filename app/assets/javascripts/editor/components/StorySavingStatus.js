import $ from 'jQuery';
import _ from 'lodash';

import I18n from '../I18n';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';

$.fn.storySavingStatus = StorySavingStatus;

export default function StorySavingStatus(options) {
  var $this = $(this);
  var holdInSavedState = false; // We need to keep displaying 'Saved!' for a bit.
  var clearHoldInSaveStateAfterDebounce;

  StorytellerUtils.assert(storySaveStatusStore, 'storySaveStatusStore must be instantiated');
  StorytellerUtils.assertIsOneOfTypes(options, 'object', 'undefined');

  options = _.extend({}, {
    savedMessageTimeout: 5000, // When the story saves, keep displaying 'Saved!' for this long.
    statusDebounceTimeout: 250 // Prevent rapid changes in status from twitching the display.
  }, options);

  var debouncedRender = _.debounce(render, options.statusDebounceTimeout);

  // Stay in holdInSavedState until things settle down for the configured timeout.
  clearHoldInSaveStateAfterDebounce = _.debounce(function() {
    if (holdInSavedState) {
      holdInSavedState = false;
      render();
    }
  }, options.savedMessageTimeout);


  function render() {
    var isStorySaved = !storySaveStatusStore.isStoryDirty();
    var isStorySaveInProgress = storySaveStatusStore.isStorySaveInProgress();
    var isSaveImpossible = storySaveStatusStore.isSaveImpossibleDueToConflict();
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
      $this.text(
        I18n.t(
          StorytellerUtils.format(
            'editor.story_save_button.{0}',
            buttonState
          )
        )
      );
      $this.prop('disabled', isStorySaveInProgress || isStorySaved || isSaveImpossible);
    }
  }

  storySaveStatusStore.addChangeListener(function() {
    holdInSavedState = !storySaveStatusStore.isStoryDirty();
    debouncedRender();
  });
  render();

  return this;
}
