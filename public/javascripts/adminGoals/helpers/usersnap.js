import _ from 'lodash';

// Control to load UserSnap only once.
var loaded = false;

// One-time setup options.
var locale = null;
var user = {};
var onClose = _.noop;

// Configuration for UserSnap, which will be bound to window.
function generateConfig() {
  return {
    emailBox: true,
    emailBoxPlaceholder: 'Please enter your email in case we need to ask you clarifying questions',
    emailBoxValue: user.email,
    emailRequired: false,
    commentBox: true,
    commentBoxPlaceholder: 'Please add comments here',
    commentRequired: true,
    tools: ['note', 'pen', 'arrow'],
    lang: getLocalizationKey(),
    loadHandler: function() {
      // Fill in some additional info which we can't expose via the widget.
      UserSnap.on('beforeSend', function(message) {
        message.addInfo = user;
      });

      // Allow consumers to bind a callback for close events.
      // The current implementation sets this callback only on initialization,
      // because there are no known usages where we need to change behavior.
      UserSnap.on('afterSend', onClose);
      UserSnap.on('cancel', onClose);
      UserSnap.on('error', onClose);
    }
  };
}

// Get the UserSnap-supported locale key. UserSnap supports approximately 20 locales,
// all of which correspond to the locale keys we use, except for German, which has
// informal and formal options. If a locale isn't recognized, UserSnap defaults to English.
function getLocalizationKey() {
  return locale === 'de' ? 'de-informal' : locale;
}

// Script loader provided by UserSnap.
function loadAsyncScript() {
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = '//api.usersnap.com/load/' +
          'b1f3034e-4a2c-4e96-8680-83ffea446194.js';
  var x = document.getElementsByTagName('script')[0];
  x.parentNode.insertBefore(s, x);
}

// Export the locked-down loader.
module.exports = {
  activate: function() {
    if (!loaded) {
      console.error('Attempted to open UserSnap without initialization!');
    } else {
      UserSnap.openReportWindow();
    }
  },
  init: function(options) {
    if (!loaded) {
      options = options || {};
      locale = options.locale;

      if (_.isPlainObject(options.user)) {
        user = _.pick(options.user, ['id', 'email', 'name', 'displayName', 'screenName']);
        user.name = user.name || user.displayName || user.screenName;
        delete user.displayName;
        delete user.screenName;
      }

      if (_.isFunction(options.onClose)) {
        onClose = options.onClose;
      }

      window._usersnapconfig = generateConfig(options);
      loadAsyncScript();
      loaded = true;
    }
  }
};