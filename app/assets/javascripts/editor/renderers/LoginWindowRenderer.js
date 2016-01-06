(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;

  var LOGIN_PATH = '/login?return_to=/stories/post_login';

  /*
   * Renders a login window if a login is in progress.
   * Related action: LOGIN_BUTTON_CLICK
   */
  function LoginWindowRenderer() {
    var loginWindow = null;

    storyteller.userSessionStore.addChangeListener(function() {
      var loginInProgress = storyteller.userSessionStore.loginInProgress();

      if (loginInProgress) {
        openLoginWindow();
      } else {
        closeLoginWindow();
      }

    });

    function openLoginWindow() {
      if (!loginWindow) {
        loginWindow = window.open(LOGIN_PATH);
      }
    }

    function closeLoginWindow() {
      if (loginWindow) {
        loginWindow.close();
        loginWindow = null;
      }
    }
  }

  storyteller.LoginWindowRenderer = LoginWindowRenderer;
})();
