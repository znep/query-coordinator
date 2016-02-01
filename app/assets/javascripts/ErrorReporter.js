(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;

  function sendEventToGoogleAnalytics(payload) {
    if (typeof window.ga === 'function') {
      ga('send', {
        hitType: 'event',
        eventCategory: payload.action,
        eventAction: payload.errorReporting.message,
        eventLabel: payload.errorReporting.label
      });
    }
  }

  function ErrorReporter() {
    storyteller.dispatcher.register(function(payload) {
      var action = payload.action;

      switch (action) {

        case Actions.FILE_UPLOAD_ERROR:
        case Actions.STORY_SAVE_FAILED:
        case Actions.EMBED_CODE_UPLOAD_ERROR:
        case Actions.COLLABORATORS_ERROR:
          sendEventToGoogleAnalytics(payload);
          break;
      }
    });
  }

  storyteller.ErrorReporter = ErrorReporter;
})();
