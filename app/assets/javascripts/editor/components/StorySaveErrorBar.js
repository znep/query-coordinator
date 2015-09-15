/*
 * A component that renders a story's save error, if any.
 * Responsible for adding the `story-save-error` class to the body
 * to allow the rest of the page styling to react.
 */
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  $.fn.storySaveErrorBar = function() {
    var $this = $(this);

    utils.assert(storyteller.storySaveStatusStore, 'storySaveStatusStore must be instantiated');

    var $container = $('<span>', { 'class': 'container' });
    var $message = $('<span>', { 'class': 'message' });
    var $tryAgainButton = $('<button>');

    $container.append($('<span>', { 'class': 'icon-warning' }));
    $container.append($message);
    $container.append($tryAgainButton);
    $this.append($container);

    function render() {
      var isStorySaveInProgress = storyteller.storySaveStatusStore.isStorySaveInProgress();
      var error = storyteller.storySaveStatusStore.lastSaveError();
      var hasError = !!error;
      var text = '';

      $(document.body).toggleClass('story-save-error', hasError);

      if (hasError) {
        $tryAgainButton.toggle(!isStorySaveInProgress && !error.conflict);

        text = I18n.t(error.conflict ?
          'editor.story_save_error_conflict' :
          'editor.story_save_error_generic'
        );
        $message.text(text);
        $tryAgainButton.text(I18n.t('editor.story_save_error_try_again'));
      }

      $this.toggleClass('visible', hasError);
    }

    $tryAgainButton.on('click', function() {
      storyteller.StoryDraftCreator.saveDraft(storyteller.userStoryUid);
    });

    storyteller.storySaveStatusStore.addChangeListener(function() {
      render();
    });
    render();

    return this;
  };

}(jQuery, window));
