/*
 * A button that allows the user to save a story. Displays progress.
 */
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  $.fn.storySaveButton = function(options) {
    var $this = $(this);
    var _holdInSavedState = false; // We need to keep displaying 'Saved!' for a bit.
    var maybeHoldInSaveState;

    utils.assert(storyteller.storySaveStatusStore, 'storySaveStatusStore must be instantiated');
    utils.assertIsOneOfTypes(options, 'object', 'undefined');

    options = _.extend({}, { savedMessageTimeout: 5000 }, options);

    // Stay in _holdInSavedState until things settle down for 5 seconds.
    maybeHoldInSaveState = _.debounce(function() {
      if (_holdInSavedState) {
        _holdInSavedState = false;
        render();
      }
    }, options.savedMessageTimeout);


    function render() {
      var isStorySaved = storyteller.storySaveStatusStore.isStorySaved();
      var isStorySaveInProgress = storyteller.storySaveStatusStore.isStorySaveInProgress();
      var isSaveImpossible = storyteller.storySaveStatusStore.isSaveImpossibleDueToConflict();
      var translationKey;

      maybeHoldInSaveState();

      if (isSaveImpossible) {
        translationKey = 'editor.story_save_button.idle';
      } else if (isStorySaveInProgress) {
        translationKey = 'editor.story_save_button.saving';
      } else if (isStorySaved) {
        if (_holdInSavedState) {
          translationKey = 'editor.story_save_button.saved';
        } else {
          translationKey = 'editor.story_save_button.idle';
        }
      } else {
        translationKey = 'editor.story_save_button.unsaved';
      }

      $this.text(I18n.t(translationKey));
      $this.prop('disabled', isStorySaveInProgress || isStorySaved || isSaveImpossible);
    }

    storyteller.storySaveStatusStore.addChangeListener(function() {
      _holdInSavedState = storyteller.storySaveStatusStore.isStorySaved();
      render();
    });
    render();

    $this.on('click', function() {
      storyteller.StoryDraftCreator.saveDraft(storyteller.userStoryUid);
    });

    return this;
  };

}(jQuery, window));
