/*
 * A component that renders a story's save error, if any.
 * Responsible for adding the `story-save-error` class to the body
 * to allow the rest of the page styling to react.
 */
(function($, root) {

  'use strict';

  var LOGIN_PATH = '/login?return_to=/stories/post_login';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  $.fn.storySaveErrorBar = function() {
    var $this = $(this);
    var loginWindow;

    utils.assert(storyteller.storySaveStatusStore, 'storySaveStatusStore must be instantiated');

    var $container = $('<span>', { 'class': 'container' });
    var $message = $('<span>', { 'class': 'message' });
    var $tryAgainButton = $('<button>', { 'class': 'try-again' });


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
    $container.append($loginMessage);
    $this.append($container);

    function render() {
      var isStorySaveInProgress = storyteller.storySaveStatusStore.isStorySaveInProgress();
      var saveError = storyteller.storySaveStatusStore.lastSaveError();
      var hasValidUserSession = storyteller.userSessionStore.hasValidSession();

      var hasError = !!saveError || !hasValidUserSession;
      var text = '';

      var showTryAgainButton =
        hasValidUserSession && // no point to retry if no session.
        hasError &&
        !isStorySaveInProgress &&
        !saveError.conflict;

      $tryAgainButton.toggle(showTryAgainButton);
      $loginMessage.toggle(!hasValidUserSession);
      $(document.body).toggleClass('story-save-error', hasError);

      if (hasValidUserSession) {
        closeLoginWindow();
      }

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

      $this.toggleClass('visible', hasError);
    }

    function closeLoginWindow() {
      if (loginWindow) {
        loginWindow.close();
        loginWindow = null;
      }
    }

    $tryAgainButton.on('click', function() {
      storyteller.StoryDraftCreator.saveDraft(storyteller.userStoryUid);
    });

    $loginMessage.find('button').on('click', function() {
      closeLoginWindow(); // Just in case the user already has the window open.
      loginWindow = window.open(LOGIN_PATH);
    });

    storyteller.storySaveStatusStore.addChangeListener(render);
    storyteller.userSessionStore.addChangeListener(render);
    render();

    return this;
  };

}(jQuery, window));
