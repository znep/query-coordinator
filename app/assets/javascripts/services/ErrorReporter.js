import { dispatcher } from '../editor/Dispatcher';
import Actions from '../editor/Actions';

export default function ErrorReporter() {
  function sendEventToGoogleAnalytics(payload) {
    if (typeof window.ga === 'function') {
      window.ga('send', {
        hitType: 'event',
        eventCategory: payload.action,
        eventAction: payload.errorReporting.message,
        eventLabel: payload.errorReporting.label
      });
    }
  }

  dispatcher.register(function(payload) {
    switch (payload.action) {
      case Actions.FILE_UPLOAD_ERROR:
      case Actions.STORY_SAVE_FAILED:
      case Actions.EMBED_CODE_UPLOAD_ERROR:
      case Actions.COLLABORATORS_ERROR:
        sendEventToGoogleAnalytics(payload);
        break;
    }
  });
}
