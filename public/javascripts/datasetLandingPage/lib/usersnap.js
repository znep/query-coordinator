import _ from 'lodash';

// Control to load UserSnap only once.
var loaded = false;

// One-time setup options.
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
    loadHandler: function() {
      // Loading is triggered by the first request to open the widget;
      // the load handler should fulfill this request immediately.
      UserSnap.openReportWindow();

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

// Script loader provided by UserSnap.
function loadAsyncScript() {
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = '//api.usersnap.com/load/' +
          'db69b856-0f89-42cb-aec0-83c78ba79c03.js';
  var x = document.getElementsByTagName('script')[0];
  x.parentNode.insertBefore(s, x);
}

// Export the locked-down loader.
module.exports = function(options) {
  if (!loaded) {
    options = options || {};

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
  } else {
    UserSnap.openReportWindow();
  }
};
