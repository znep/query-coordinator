import $ from 'jQuery';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { storySaveStatusStore } from '../stores/StorySaveStatusStore';
import { userSessionStore } from '../stores/UserSessionStore';

export default function ErrorModalRenderer() {
  var $modal = $('#error-modal-container');
  var $warningMessage = $modal.find('.error-warning-message');
  var $loginButton = $modal.find('.btn-login');
  var $reloadButton = $modal.find('.btn-reload');
  var $modalContents = $modal.children();

  var reasonOpenedFor = null;

  storySaveStatusStore.addChangeListener(render);
  userSessionStore.addChangeListener(render);

  $modal.modal({
    title: StorytellerUtils.format(
      '<span class="icon-warning"></span> {0}',
      I18n.t('editor.generic_error')
    ),
    content: $modalContents
  });

  $modal.on('modal-dismissed', function() {
    $modal.trigger('modal-close');
  });

  $reloadButton.click(function() {
    window.document.location.reload();
  });

  $loginButton.click(function() {
    dispatcher.dispatch({
      action: Actions.LOGIN_BUTTON_CLICK
    });
  });

  function render() {
    var reason = reasonForBeingOpen();
    var userCausingConflict = storySaveStatusStore.userCausingConflict();
    var userLinkOrPlaceholder;

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
      // User details are loaded async, show a placeholder while that is in flight.
      if (userCausingConflict) {
        userLinkOrPlaceholder =
          $('<a>', {
            target: '_blank',
            href: StorytellerUtils.format('/profile/{0}', userCausingConflict.id)
          }).text(userCausingConflict.displayName);
      } else {
        userLinkOrPlaceholder = I18n.t('editor.story_save_error_conflict_generic_user_name');
      }

      $warningMessage.empty().append(
        I18n.t('editor.story_save_error_conflict_detail_1'),
        ' ',
        userLinkOrPlaceholder,
        ' ',
        I18n.t('editor.story_save_error_conflict_detail_2')
      );

      $reloadButton.show();
    }

  }

  // Returns why the modal should be open right now, if any.
  // Returns one of:
  // - 'CONFLICT'
  // - 'EXPIRED_SESSION'
  // - null
  function reasonForBeingOpen() {
    var hasConflict = storySaveStatusStore.isSaveImpossibleDueToConflict();
    var hasValidUserSession = userSessionStore.hasValidSession();

    if (hasConflict) {
      return 'CONFLICT';
    } else if (!hasValidUserSession) {
      return 'EXPIRED_SESSION';
    } else {
      return null;
    }
  }
}
