import { getDefaultStore } from 'testStore';
import reducer from 'reducers/view';
import {
  requestedViewPublish,
  handleViewPublishSuccess,
  handleViewPublishError,
  clearViewPublishError
} from 'actions/view';

describe('reducers/view', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('REQUESTED_VIEW_PUBLISH', function() {
    it('sets isPublishing to true', function() {
      expect(state.isPublishing).to.equal(false);
      state = reducer(state, requestedViewPublish());
      expect(state.isPublishing).to.equal(true);
    });

    it('sets hasPublishingSuccess to false', function() {
      state.hasPublishingSuccess = true;
      state = reducer(state, requestedViewPublish());
      expect(state.hasPublishingSuccess).to.equal(false);
    });

    it('sets hasPublishingError to false', function() {
      state.hasPublishingError = true;
      state = reducer(state, requestedViewPublish());
      expect(state.hasPublishingError).to.equal(false);
    });
  });

  describe('HANDLE_VIEW_PUBLISH_SUCCESS', function() {
    it('sets isPublishing to false', function() {
      state.isPublishing = true;
      state = reducer(state, handleViewPublishSuccess());
      expect(state.isPublishing).to.equal(false);
    });

    it('sets hasPublishingSuccess to true', function() {
      expect(state.hasPublishingSuccess).to.equal(false);
      state = reducer(state, handleViewPublishSuccess());
      expect(state.hasPublishingSuccess).to.equal(true);
    });

    it('sets hasPublishingError to false', function() {
      state.hasPublishingError = true;
      state = reducer(state, handleViewPublishSuccess());
      expect(state.hasPublishingError).to.equal(false);
    });
  });

  describe('HANDLE_VIEW_PUBLISH_ERROR', function() {
    it('sets isPublishing to false', function() {
      state.isPublishing = true;
      state = reducer(state, handleViewPublishError());
      expect(state.isPublishing).to.equal(false);
    });

    it('sets hasPublishingSuccess to false', function() {
      state.hasPublishingSuccess = true;
      state = reducer(state, handleViewPublishError());
      expect(state.hasPublishingSuccess).to.equal(false);
    });

    it('sets hasPublishingError to true', function() {
      expect(state.hasPublishingError).to.equal(false);
      state = reducer(state, handleViewPublishError());
      expect(state.hasPublishingError).to.equal(true);
    });
  });

  describe('CLEAR_VIEW_PUBLISH_ERROR', function() {
    it('sets hasPublishingError to false', function() {
      state.hasPublishingError = true;
      state = reducer(state, clearViewPublishError());
      expect(state.hasPublishingError).to.equal(false);
    });
  });
});
