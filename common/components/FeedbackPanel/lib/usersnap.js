import _ from 'lodash';

// Promise for loading library
let usersnapPromise = null;

// One-time setup options.
let locale = null;
let user = {};
let onClose = _.noop;

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
    loadHandler: () => {
      // Fill in some additional info which we can't expose via the widget.
      window.UserSnap.on('beforeSend', (message) => {
        message.addInfo = user;
      });

      // Allow consumers to bind a callback for close events.
      // The current implementation sets this callback only on initialization,
      // because there are no known usages where we need to change behavior.
      window.UserSnap.on('afterSend', onClose);
      window.UserSnap.on('cancel', onClose);
      window.UserSnap.on('error', onClose);
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
function loadAsyncScript(projectID) {
  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = `//api.usersnap.com/load/${projectID}.js`;
  const x = document.getElementsByTagName('script')[0];
  x.parentNode.insertBefore(s, x);
}

// Export the locked-down loader.
function activate() {
  if (!usersnapPromise) {
    console.error('Attempted to open UserSnap without initialization!');
  } else {
    return usersnapPromise.then(() => {
      window.UserSnap.start();
    });
  }
}

function init(projectID, options) {
  if (!/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/.test(projectID)) {
    console.error('Must provide a valid project ID to initialize UserSnap!');
    return;
  }

  if (!usersnapPromise) {
    usersnapPromise = new Promise((resolve) => {
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
      loadAsyncScript(projectID);

      const interval = setInterval(() => {
        if (window.UserSnap) {
          resolve();
          clearInterval(interval);
        }
      }, 50);
    });
  }

  return usersnapPromise;
}

export default { activate, init };

