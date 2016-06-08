// Wrapper around the grecaptcha object loaded by Recaptcha
import _ from 'lodash';

var loaded = false;

// Initialize a Recaptcha widget in your page
// - element: An element you want to render a Recaptcha widget into.
// - callback: A function to call when recaptcha is initialized.
//
// For more information about the Recaptcha JS API, see Google's documentation here:
// https://developers.google.com/recaptcha/docs/display#js_api
//
// Note the element's contents are replaced with an empty child element to ensure this
// function can be called on the same element multiple times.
function init(element, callback) {
  var recaptcha = document.createElement('div');
  recaptcha.id = 'recaptcha';

  element.innerHTML = '';
  element.appendChild(recaptcha);

  var _init = setInterval(function() {
    if (_.isUndefined(window.grecaptcha)) { return; }

    // See here for more options: https://developers.google.com/recaptcha/docs/display#render_param
    var id = window.grecaptcha.render('recaptcha', {
      sitekey: window.serverConfig.recaptchaKey,
      hl: window.serverConfig.locale
    });

    loaded = true;

    if (_.isFunction(callback)) {
      callback(id);
    }

    clearInterval(_init);
  }, 100);
}

// window.grecaptcha.getResponse returns an empty string until the challenge has been
// completed, when it then returns a token. That tells us that the challenge was
// completed, but it doesn't tell us what domain it was completed on or if Google
// considers the response valid, so we need to store the token and verify separately.
function getResponseToken(id) {
  if (loaded) {
    return window.grecaptcha.getResponse(id);
  }
}

function reset(id) {
  if (loaded) {
    window.grecaptcha.reset(id);
  }
}

module.exports = {
  init: init,
  getResponseToken: getResponseToken,
  reset: reset
};
