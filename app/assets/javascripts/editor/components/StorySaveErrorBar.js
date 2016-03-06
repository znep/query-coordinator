import $ from 'jQuery';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { autosave } from '../Autosave';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';
import { userSessionStore } from '../stores/UserSessionStore';

$.fn.storySaveErrorBar = StorySaveErrorBar;

export default function StorySaveErrorBar() {
  StorytellerUtils.assert(
    storySaveStatusStore,
    'storySaveStatusStore must be instantiated'
  );

  var $this = $(this);
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
    var saveError = storySaveStatusStore.lastSaveError();
    var hasValidUserSession = userSessionStore.hasValidSession();

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
    $container.addClass('story-save-error-bar-trying-again');
    autosave.saveASAP();
  });

  $loginMessage.find('button').on('click', function() {
    dispatcher.dispatch({
      action: Actions.LOGIN_BUTTON_CLICK
    });
  });

  storySaveStatusStore.addChangeListener(render);
  userSessionStore.addChangeListener(render);
  render();

  return this;
}
