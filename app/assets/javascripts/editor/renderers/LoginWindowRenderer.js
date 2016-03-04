import Constants from '../Constants';
import { userSessionStore } from '../stores/UserSessionStore';

/*
 * Renders a login window if a login is in progress.
 * Related action: LOGIN_BUTTON_CLICK
 */
export default function LoginWindowRenderer() {
  var loginWindow = null;

  userSessionStore.addChangeListener(function() {
    var loginInProgress = userSessionStore.loginInProgress();

    if (loginInProgress) {
      openLoginWindow();
    } else {
      closeLoginWindow();
    }

  });

  function openLoginWindow() {
    if (!loginWindow) {
      loginWindow = window.open(Constants.LOGIN_PATH);
    }
  }

  function closeLoginWindow() {
    if (loginWindow) {
      loginWindow.close();
      loginWindow = null;
    }
  }
}
