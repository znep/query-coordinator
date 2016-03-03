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
    var $tryAgainButton = $('<button>', { 'class': 'try-again' });
    var $tryingAgainSpinner = $('<span>', { 'class': 'trying-again-spinner' });

    var $loginMessage = $('<span>', { 'class': 'message login' }).
      append(
        $('<span>').text(I18n.t('editor.login_phrase_1_good_manners'))
      ).
      append(
        $('<button>').text(I18n.t('editor.login_phrase_2_link_text'))
      );
    $tryAgainButton.text(I18n.t('editor.story_save_error_try_again'));

    $container.append($('<span>', { 'class': 'icon-warning' }));
    $container.append($message);
    $container.append($tryAgainButton);
    $container.append($tryingAgainSpinner);
    $container.append($loginMessage);
    $this.append($container);

    function render() {
      var saveError = storyteller.storySaveStatusStore.lastSaveError();
      var hasValidUserSession = storyteller.userSessionStore.hasValidSession();

      var hasError = !!saveError || !hasValidUserSession;
      var text = '';

      var showTryAgainButton =
        hasValidUserSession && // no point to retry if no session.
        hasError &&
        !saveError.conflict;

      $tryAgainButton.toggleClass('available', showTryAgainButton);
      $loginMessage.toggle(!hasValidUserSession);
      $(document.body).toggleClass('story-save-error', hasError);

      if (hasError) {
        if (!hasValidUserSession) {
          text = I18n.t('editor.user_session_timeout');
        } else {
          text = I18n.t(saveError.conflict ?
            'editor.story_save_error_conflict' :
            'editor.story_save_error_generic'
          );
        }
        $message.text(text);
      }

      if (hasError && !$this.hasClass('visible')) {
        // Was closed, now opening
        $container.removeClass('story-save-error-bar-trying-again');
      }

      $this.toggleClass('visible', hasError);
    }

    $tryAgainButton.on('click', function() {
      // Show the "I'm trying" feedback until the error bar goes away.
      $container.addClass('story-save-error-bar-trying-again');
      storyteller.autosave.saveASAP();
    });

    $loginMessage.find('button').on('click', function() {
      storyteller.dispatcher.dispatch({
        action: Actions.LOGIN_BUTTON_CLICK
      });
    });

    storyteller.storySaveStatusStore.addChangeListener(render);
    storyteller.userSessionStore.addChangeListener(render);
    render();

    return this;
  };

}(jQuery, window));
