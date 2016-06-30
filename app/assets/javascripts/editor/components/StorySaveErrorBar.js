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
  var $tryAgainButton = $('<button>', { 'class': 'btn btn-try-again btn-alternate-2 btn-xs' });

  $tryAgainButton.append(
    $('<span>').text(I18n.t('editor.story_save_error_try_again'))
  );

  $container.append($('<span>', { 'class': 'icon-warning' }));
  $container.append($message);
  $container.append($tryAgainButton);
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

    $tryAgainButton.
      toggle(showTryAgainButton).
      toggleClass('available', showTryAgainButton);

    $(document.body).toggleClass('story-save-error', hasError);

    if (hasError) {
      if (!hasValidUserSession) {
        text = [
          $('<span>').text(I18n.t('editor.user_session_timeout')),
          $('<a href="" role="button">').text(I18n.t('editor.story_save_error_login_button'))
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
      $tryAgainButton.removeClass('btn-busy');
    }

    $this.toggleClass('visible', hasError);
  }

  $tryAgainButton.on('click', function() {
    $container.addClass('story-save-error-bar-trying-again');
    $tryAgainButton.addClass('btn-busy');

    autosave.saveASAP();
  });

  storySaveStatusStore.addChangeListener(render);
  userSessionStore.addChangeListener(render);
  render();

  return this;
}
