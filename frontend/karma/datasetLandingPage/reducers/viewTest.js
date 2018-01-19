import { assert } from 'chai';
import { getDefaultStore } from 'testStore';
import reducer from 'datasetLandingPage/reducers/view';
import {
  requestedViewPublish,
  handleViewPublishSuccess,
  handleViewPublishError,
  clearViewPublishError,
  handleFetchRowCountSuccess,
  handleFetchRowCountError,
  onSubscriptionChange,
  checkSubscriptionOnLoad,
  handleCheckSubscriptionOnLoadError
} from 'datasetLandingPage/actions/view';

describe('reducers/view', () => {
  let state;

  beforeEach(() => {
    state = reducer();
  });

  describe('REQUESTED_VIEW_PUBLISH', () => {
    it('sets isPublishing to true', () => {
      state.isPublishing = false;
      state = reducer(state, requestedViewPublish());
      assert.isTrue(state.isPublishing);
    });

    it('sets hasPublishingSuccess to false', () => {
      state.hasPublishingSuccess = true;
      state = reducer(state, requestedViewPublish());
      assert.isFalse(state.hasPublishingSuccess);
    });

    it('sets hasPublishingError to false', () => {
      state.hasPublishingError = true;
      state = reducer(state, requestedViewPublish());
      assert.isFalse(state.hasPublishingError);
    });
  });

  describe('HANDLE_VIEW_PUBLISH_SUCCESS', () => {
    it('sets isPublishing to false', () => {
      state.isPublishing = true;
      state = reducer(state, handleViewPublishSuccess());
      assert.isFalse(state.isPublishing);
    });

    it('sets hasPublishingSuccess to true', () => {
      state.hasPublishingSuccess = false;
      state = reducer(state, handleViewPublishSuccess());
      assert.isTrue(state.hasPublishingSuccess);
    });

    it('sets hasPublishingError to false', () => {
      state.hasPublishingError = true;
      state = reducer(state, handleViewPublishSuccess());
      assert.isFalse(state.hasPublishingError);
    });
  });

  describe('HANDLE_VIEW_PUBLISH_ERROR', () => {
    it('sets isPublishing to false', () => {
      state.isPublishing = true;
      state = reducer(state, handleViewPublishError());
      assert.isFalse(state.isPublishing);
    });

    it('sets hasPublishingSuccess to false', () => {
      state.hasPublishingSuccess = true;
      state = reducer(state, handleViewPublishError());
      assert.isFalse(state.hasPublishingSuccess);
    });

    it('sets hasPublishingError to true', () => {
      state.hasPublishingError = false;
      state = reducer(state, handleViewPublishError());
      assert.isTrue(state.hasPublishingError);
    });
  });

  describe('CLEAR_VIEW_PUBLISH_ERROR', () => {
    it('sets hasPublishingError to false', () => {
      state.hasPublishingError = true;
      state = reducer(state, clearViewPublishError());
      assert.isFalse(state.hasPublishingError);
    });
  });

  describe('HANDLE_FETCH_ROW_COUNT_SUCCESS', () => {
    it('sets rowCount to a number', () => {
      state.rowCount = 'foo';
      state = reducer(state, handleFetchRowCountSuccess(52));
      assert.strictEqual(state.rowCount, 52);
    });
  });

  describe('HANDLE_FETCH_ROW_COUNT_ERROR', () => {
    it('sets rowCount to null', () => {
      state.rowCount = 'foo';
      state = reducer(state, handleFetchRowCountError());
      assert.isNull(state.rowCount);
    });
  });

  describe('ON_SUBSCRIPTION_CHANGE', () => {
    it('sets subscribed to false', () => {
      state = reducer(state, onSubscriptionChange(null));
      assert.isFalse(state.subscribed);
      assert.isNull(state.subscriptionId);
    });

    it('sets subscribed to true', () => {
      state = reducer(state, onSubscriptionChange(123));
      assert.isTrue(state.subscribed);
      assert.strictEqual(state.subscriptionId, 123);
    });
  });

  describe('CHECK_SUBSCRIPTION_ON_LOAD', () => {
    it('sets subscribed to false', () => {
      state = reducer(state, checkSubscriptionOnLoad(null));
      assert.isFalse(state.subscribed);
      assert.isNull(state.subscriptionId);
    });

    it('sets subscribed to true', () => {
      state = reducer(state, checkSubscriptionOnLoad(123));
      assert.isTrue(state.subscribed);
      assert.strictEqual(state.subscriptionId, 123);
    });
  });

  describe('HANDLE_CHECK_SUBSCRIPTION_ON_LOAD_ERROR', () => {
    it('sets subscribed to false', () => {
      state = reducer(state, handleCheckSubscriptionOnLoadError());
      assert.isFalse(state.subscribed);
      assert.isNull(state.subscriptionId);
    });
  });

});
