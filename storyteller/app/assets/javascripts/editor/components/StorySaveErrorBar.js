import $ from 'jquery';

import I18n from '../I18n';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import { assert } from 'common/js_utils';
import { dispatcher } from '../Dispatcher';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';
import { userSessionStore } from '../stores/UserSessionStore';

$.fn.storySaveErrorBar = StorySaveErrorBar;

export default function StorySaveErrorBar() {
  assert(
    storySaveStatusStore,
    'storySaveStatusStore must be instantiated'
  );

  const $this = $(this);
  const $container = $('<span>', { 'class': 'container' });
  const $message = $('<span>', { 'class': 'message' });
  const $spinner = $('<span>', { 'class': 'spinner-default' });


  $container.append([
    $('<span>', { 'class': 'socrata-icon-warning' }),
    $message,
    $spinner
  ]);

  $this.append($container);

  function render() {
    let text = '';
    let saveError = storySaveStatusStore.lastSaveError();
    const hasValidUserSession = userSessionStore.hasValidSession();
    const hasError = !!saveError || !hasValidUserSession;

    $(document.body).toggleClass('story-save-error', hasError);

    if (hasError) {
      if (!hasValidUserSession) {
        text = [
          $('<span>').text(I18n.t('editor.user_session_timeout')),
          $('<a class="login-link" href="" role="button">').text(I18n.t('editor.story_save_error_login_button'))
        ];
      } else if (saveError.conflict) {
        text = Environment.IS_GOAL ?
          I18n.t('editor.goal_save_error_conflict') :
          I18n.t('editor.story_save_error_conflict');
      } else {
        text = I18n.t('editor.story_save_error_generic');
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

  storySaveStatusStore.addChangeListener(render);
  userSessionStore.addChangeListener(render);
  render();

  return this;
}
