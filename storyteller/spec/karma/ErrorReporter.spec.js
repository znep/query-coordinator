import _ from 'lodash';
import { assert } from 'chai';

import Actions from '../../app/assets/javascripts/editor/Actions';
import ErrorReporter from '../../app/assets/javascripts/services/ErrorReporter';
import { dispatcher } from '../../app/assets/javascripts/editor/Dispatcher';

describe('ErrorReporter', function() {

  var mockPayload = {
    error: { step: 'step' },
    errorReporting: { message: 'a message', label: 'a label' }
  };

  function dispatchAction(action, payload) {
    payload = _.extend({ action: action }, payload);
    dispatcher.dispatch(payload);
  }

  function assertEventSentToGoogleAnalytics(done, action) {
    window.ga = function(request, details) {
      assert.equal(request, 'send');
      assert.deepEqual(details, {
        hitType: 'event',
        eventCategory: action,
        eventAction: 'a message',
        eventLabel: 'a label'
      });

      delete window.ga;
      done();
    };
  }

  beforeEach(function() {
    new ErrorReporter(); // eslint-disable-line no-new
  });

  describe('STORY_SAVE_FAILED', function() {

    it('sends an exception report with ga', function(done) {
      assertEventSentToGoogleAnalytics(done, 'STORY_SAVE_FAILED');

      dispatchAction(Actions.STORY_SAVE_FAILED, mockPayload);
    });
  });

  describe('COLLABORATORS_ERROR', function() {

    it('sends an exception report with ga', function(done) {
      assertEventSentToGoogleAnalytics(done, 'COLLABORATORS_ERROR');

      dispatchAction(Actions.COLLABORATORS_ERROR, mockPayload);
    });
  });
});
