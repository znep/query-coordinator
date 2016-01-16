describe('ErrorReporter', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;
  var mockPayload = { error: { step: 'step' }, errorReporting: { message: 'a message', label: 'a label' } };

  function dispatchAction(action, payload) {
    payload = _.extend({ action: action }, payload);
    storyteller.dispatcher.dispatch(payload);
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
    storyteller.ErrorReporter();
  });

  describe('FILE_UPLOAD_ERROR', function() {

    it('sends an exception report with ga', function(done) {
      assertEventSentToGoogleAnalytics(done, 'FILE_UPLOAD_ERROR');

      dispatchAction(Actions.FILE_UPLOAD_ERROR, mockPayload);
    });
  });

  describe('STORY_SAVE_FAILED', function() {

    it('sends an exception report with ga', function(done) {
      assertEventSentToGoogleAnalytics(done, 'STORY_SAVE_FAILED');

      dispatchAction(Actions.STORY_SAVE_FAILED, mockPayload);
    });
  });

  describe('EMBED_CODE_UPLOAD_ERROR', function() {

    it('sends an exception report with ga', function(done) {
      assertEventSentToGoogleAnalytics(done, 'EMBED_CODE_UPLOAD_ERROR');

      dispatchAction(Actions.EMBED_CODE_UPLOAD_ERROR, mockPayload);
    });
  });

  describe('COLLABORATORS_ERROR', function() {

    it('sends an exception report with ga', function(done) {
      assertEventSentToGoogleAnalytics(done, 'COLLABORATORS_ERROR');

      dispatchAction(Actions.COLLABORATORS_ERROR, mockPayload);
    });
  });
});
