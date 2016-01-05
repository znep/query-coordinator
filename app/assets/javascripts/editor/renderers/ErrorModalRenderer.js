(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;

  function ErrorModalRenderer() {
    var $modal = $('#error-modal-container');
    var $warningMessage = $modal.find('.error-warning-message');
    var $okButton = $modal.find('.btn-ok');
    var $reloadButton = $modal.find('.btn-reload');
    var $modalContents = $modal.children();

    var reasonOpenedFor = null;

    storyteller.storySaveStatusStore.addChangeListener(render);
    storyteller.userSessionStore.addChangeListener(render);

    $modal.modal({
      title: I18n.t('editor.generic_error'),
      content: $modalContents
    });

    $modal.on('modal-dismissed', function() {
      $modal.trigger('modal-close');
    });

    $okButton.click(function() {
      $modal.trigger('modal-close');
      if (reasonForBeingOpen() === 'EXPIRED_SESSION') {
        storyteller.dispatcher.dispatch({
          action: Actions.LOGIN_BUTTON_CLICK
        });
      }
    });

    $reloadButton.click(function() {
      window.document.location.reload();
    });

    // The only button in the warning message is a login button.
    $warningMessage.on('click', 'button', function() {
      storyteller.dispatcher.dispatch({
        action: Actions.LOGIN_BUTTON_CLICK
      });
    });

    function render() {
      var reason = reasonForBeingOpen();
      var userCausingConflict = storyteller.storySaveStatusStore.userCausingConflict();
      var userLinkOrPlaceholder;

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
          I18n.t('editor.user_session_timeout') + ' ',
          I18n.t('editor.login_phrase_1_good_manners'),
          $('<button>').text(I18n.t('editor.login_phrase_2_link_text'))
        );
        $reloadButton.hide();
      } else if (reason === 'CONFLICT') {
        // User details are loaded async, show a placeholder while that is in flight.
        if (userCausingConflict) {
          userLinkOrPlaceholder =
            $('<a>', {
              target: 'blank',
              href: '/profile/{0}'.format(userCausingConflict.id)
            }).text(userCausingConflict.displayName);
        } else {
          userLinkOrPlaceholder = I18n.t('editor.story_save_error_conflict_generic_user_name');
        }

        $warningMessage.empty().append(
          I18n.t('editor.story_save_error_conflict_detail_1') + ' ',
          userLinkOrPlaceholder,
          ' ' + I18n.t('editor.story_save_error_conflict_detail_2')
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
      var hasConflict = storyteller.storySaveStatusStore.isSaveImpossibleDueToConflict();
      var hasValidUserSession = storyteller.userSessionStore.hasValidSession();

      if (hasConflict) {
        return 'CONFLICT';
      } else if (!hasValidUserSession) {
        return 'EXPIRED_SESSION';
      } else {
        return null;
      }
    }
  }

  storyteller.ErrorModalRenderer = ErrorModalRenderer;
})();
