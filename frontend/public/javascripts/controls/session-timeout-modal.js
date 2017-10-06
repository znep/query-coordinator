$(function() {
  'use strict';

  var startSessionCheck = function() {

    //do nothing if the user is not logged in.
    if (!blist.currentUserId) {
      return;
    }

    var $m;

    var createModal = function() {
      //create the modal
      $('body').append(
        $.tag2({
          _: 'div',
          className: 'modalDialog',
          id: 'sessionTimeoutModal',
          contents: [{
            _: 'h2',
            contents: $.t('core.dialogs.session_timeout.warning.title')
          }, {
            _: 'p',
            contents: $.t('core.dialogs.session_timeout.warning.body_html')
          }, {
            _: 'div',
            className: 'buttonWrapper',
            contents: [{
              _: 'a',
              id: 'keepSessionButton',
              className: 'button',
              contents: $.t('core.dialogs.session_timeout.warning.belay_button')
            }]
          }]
        })
      );
      $m = $('#sessionTimeoutModal');
      $m.jqm();
      $('#keepSessionButton').click(function(event) {
        event.preventDefault();
        $m.jqmHide();
        delayExpiration();
      });

    };

    var secondsUntilTimeout,
      modalTimer,
      countdownSeconds = 60,
      secondsRemaining,
      updateTimer;

    //determine how much time is left in the session
    function checkTime() {
      $.socrataServer.makeRequest({
        url: '/logout/expire_if_idle',
        success: function(response) {
          if (response.expired) {
            blist.util.railsFlash($.t('core.dialogs.session_timeout.notice'));
            window.document.location = '/signed_out';
          } else {
            secondsUntilTimeout = parseFloat(response.seconds);
            if (secondsUntilTimeout > countdownSeconds) {
              if ($m) {
                $m.jqmHide();
              }
              scheduleCheckTime();
            } else {
              if (!$m) {
                createModal();
              }
              showModal();
            }
          }
        },
        anonymous: true,
        error: function() {
          setTimeout(checkTime, 10 * 1000);
        }
      });
    }
    checkTime();

    function scheduleCheckTime() {
      if (modalTimer) {
        clearTimeout(modalTimer);
      }
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
      modalTimer = setTimeout(checkTime, (secondsUntilTimeout - countdownSeconds) * 1000);
    }

    function showModal() {
      secondsRemaining = secondsUntilTimeout;
      if (updateTimer) {
        clearInterval(updateTimer);
      }
      updateTimer = setInterval(countdown, 1000);
      countdown();
      $m.jqmShow();
    }

    function countdown() {
      $('#secondsRemaining').text(secondsRemaining);
      if (secondsRemaining <= 0) {
        if (updateTimer) {
          clearInterval(updateTimer);
        }
        setTimeout(checkTime, 1000);
        return;
      }
      if (secondsRemaining > 0) {
        secondsRemaining--;
      }
    }

    function delayExpiration() {
      $.socrataServer.makeRequest({
        url: '/login/extend',
        success: function(response) {
          secondsUntilTimeout = parseFloat(response.seconds);
          scheduleCheckTime();
          $m.jqmHide();
        },
        anonymous: false,
        error: function() {
          secondsUntilTimeout = 1000 * 20;
          scheduleCheckTime();
        }
      });
    }
  };

  if (blist.configuration.onCurrentUser) {
    blist.configuration.onCurrentUser(startSessionCheck);
  }

});
