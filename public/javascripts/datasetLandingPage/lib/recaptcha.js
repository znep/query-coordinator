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
      sitekey: window.contactFormData.recaptchaKey,
      hl: window.contactFormData.locale
    });

    loaded = true;

    if (_.isFunction(callback)) {
      callback(id);
    }

    clearInterval(_init);
  }, 100);
}

function verify(id) {
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
  verify: verify,
  reset: reset
};
