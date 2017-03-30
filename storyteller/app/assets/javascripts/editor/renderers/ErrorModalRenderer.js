import $ from 'jquery';

import I18n from '../I18n';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import { dispatcher } from '../Dispatcher';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';
import { userSessionStore } from '../stores/UserSessionStore';

export default function ErrorModalRenderer() {
  const $modal = $('#error-modal-container');
  const $warningMessage = $modal.find('.error-warning-message');
  const $loginButton = $modal.find('.btn-login');
  const $reloadButton = $modal.find('.btn-reload');
  const $modalContents = $modal.children();

  let reasonOpenedFor = null;

  storySaveStatusStore.addChangeListener(render);
  userSessionStore.addChangeListener(render);

  $modal.modal({
    title: `<span class="socrata-icon-warning"></span> ${I18n.t('editor.generic_error')}`,
    content: $modalContents
  });

  $modal.on('modal-dismissed', () => $modal.trigger('modal-close'));

  $reloadButton.click(() => window.document.location.reload());

  $loginButton.click(() => {
    dispatcher.dispatch({
      action: Actions.LOGIN_BUTTON_CLICK
    });
  });

  function render() {
    const reason = reasonForBeingOpen();

    $loginButton.hide();

    // If the reason for us being open changes, ensure
    // the modal is open (the user may have dismissed it
    // for the last error).
    if (reasonOpenedFor !== reason) {
      reasonOpenedFor = reason;
      $modal.trigger(reason ? 'modal-open' : 'modal-close');
    }

    // Always update, regardless of whether or not the modal needs to be opened.
    if (reason === 'EXPIRED_SESSION') {
      $warningMessage.empty().append(
        I18n.t('editor.user_session_timeout')
      );

      $reloadButton.hide();
      $loginButton.show();
    } else if (reason === 'CONFLICT') {
      renderConflictMessage(storySaveStatusStore.userCausingConflict());
      $reloadButton.show();
    }

  }

  // Returns why the modal should be open right now, if any.
  // Returns one of:
  // - 'CONFLICT'
  // - 'EXPIRED_SESSION'
  // - null
  function reasonForBeingOpen() {
    const hasConflict = storySaveStatusStore.isSaveImpossibleDueToConflict();
    const hasValidUserSession = userSessionStore.hasValidSession();

    if (hasConflict) {
      return 'CONFLICT';
    } else if (!hasValidUserSession) {
      return 'EXPIRED_SESSION';
    } else {
      return null;
    }
  }

  function renderConflictMessage(user) {
    let userPlaceholder;
    const prefix = Environment.IS_GOAL ? 'goal' : 'story';

    if (user) {
      // User details are loaded async, show a placeholder while that is in flight.
      userPlaceholder = $('<a>', {
        target: '_blank',
        href: `/profile/${user.id}`
      }).text(user.displayName);
    } else {
      userPlaceholder = I18n.t(`editor.${prefix}_save_error_conflict_generic_user_name`);
    }

    $warningMessage.empty().append(
      I18n.t(`editor.${prefix}_save_error_conflict_detail_1`),
      ' ',
      userPlaceholder,
      ' ',
      I18n.t(`editor.${prefix}_save_error_conflict_detail_2`)
    );
  }
}
