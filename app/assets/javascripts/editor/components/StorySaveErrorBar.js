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

  const $this = $(this);
  const $container = $('<span>', { 'class': 'container' });
  const $message = $('<span>', { 'class': 'message' });
  const $tryAgainButton = $('<a>', { 'class': 'try-again-link', 'href': '#' });
  const $spinner = $('<span>', { 'class': 'spinner-default' });

  $tryAgainButton.append(
    $('<span>').text(I18n.t('editor.story_save_error_try_again'))
  );

  $container.append([
    $('<span>', { 'class': 'icon-warning' }),
    $message,
    $tryAgainButton,
    $spinner
  ]);

  $this.append($container);

  function render() {
    let text = '';
    let saveError = storySaveStatusStore.lastSaveError();
    const hasValidUserSession = userSessionStore.hasValidSession();
    const hasError = !!saveError || !hasValidUserSession;

    const showTryAgainButton =
      hasValidUserSession && // no point to retry if no session.
      hasError &&
      !saveError.conflict;

    $tryAgainButton.
      toggleClass('available', showTryAgainButton);

    $(document.body).toggleClass('story-save-error', hasError);

    if (hasError) {
      if (!hasValidUserSession) {
        text = [
          $('<span>').text(I18n.t('editor.user_session_timeout')),
          $('<a class="login-link" href="" role="button">').text(I18n.t('editor.story_save_error_login_button'))
        ];
      } else {
        text = I18n.t(saveError.conflict ?
          'editor.story_save_error_conflict' :
          'editor.story_save_error_generic'
        );
      }

      $message.empty().append(text);
      $message.find('a').on('click', function(event) {
        event.preventDefault();

        dispatcher.dispatch({
          action: Actions.LOGIN_BUTTON_CLICK
        });
      });
    }

    if (hasError && !$this.hasClass('visible')) {
      // Was closed, now opening
      $container.removeClass('story-save-error-bar-trying-again');
    }

    $this.toggleClass('visible', hasError);
  }

  $tryAgainButton.on('click', function(e) {
    e.preventDefault();

    $container.addClass('story-save-error-bar-trying-again');

    autosave.saveASAP();
  });

  storySaveStatusStore.addChangeListener(render);
  userSessionStore.addChangeListener(render);
  render();

  return this;
}
