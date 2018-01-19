import { expect, assert } from 'chai';
import { getDefaultStore } from 'testStore';
import mockRelatedView from '../data/mockRelatedView';
import reducer from 'datasetLandingPage/reducers/relatedViews';
import {
  requestRelatedViews,
  receiveRelatedViews,
  handleRelatedViewsError,
  dismissRelatedViewsError,
  toggleRelatedViews
} from 'datasetLandingPage/actions/relatedViews';

describe('reducers/relatedViews', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('REQUEST_RELATED_VIEWS', function() {
    it('sets isLoading to true', function() {
      state.isLoading = false;
      state = reducer(state, requestRelatedViews());
      expect(state.isLoading).to.equal(true);
    });
  });

  describe('RECEIVE_RELATED_VIEWS', function() {
    beforeEach(function() {
      state.isLoading = true;
      state.viewList = _.fill(Array(3), mockRelatedView);
    });

    it('appends up to 3 elements to the viewList', function() {
      var payload = _.fill(Array(4), mockRelatedView);
      state = reducer(state, receiveRelatedViews(payload));
      expect(state.viewList).to.have.length(6);
    });

    it('sets hasMore to true if there are more than 3 elements in the payload', function() {
      var payload = _.fill(Array(4), mockRelatedView);
      state = reducer(state, receiveRelatedViews(payload));
      expect(state.hasMore).to.equal(true);
    });

    it('sets hasMore to false if there are less than 3 elements in the payload', function() {
      var payload = _.fill(Array(2), mockRelatedView);
      state = reducer(state, receiveRelatedViews(payload));
      expect(state.hasMore).to.equal(false);
    });

    it('sets hasError to false', function() {
      state.hasError = true;
      var payload = _.fill(Array(2), mockRelatedView);
      state = reducer(state, receiveRelatedViews(payload));
      expect(state.hasError).to.equal(false);
    });

    it('sets isLoading to false', function() {
      state = reducer(state, receiveRelatedViews([]));
      expect(state.isLoading).to.equal(false);
    });
  });

  describe('HANDLE_RELATED_VIEWS_ERROR', function() {
    beforeEach(function() {
      state.isLoading = true;
      state.hasError = false;
    });

    it('sets isLoading to false', function() {
      state = reducer(state, handleRelatedViewsError());
      expect(state.isLoading).to.equal(false);
    });

    it('sets hasError to true', function() {
      state = reducer(state, handleRelatedViewsError());
      expect(state.hasError).to.equal(true);
    });
  });

  describe('DISMISS_RELATED_VIEWS_ERROR', function() {
    beforeEach(function() {
      state.hasError = true;
    });

    it('sets hasError to false', function() {
      state = reducer(state, dismissRelatedViewsError());
      expect(state.hasError).to.equal(false);
    });
  });

  describe('TOGGLE_RELATED_VIEWS', function() {
    it('toggles isCollapsed', function() {
      state.isCollapsed = false;
      state = reducer(state, toggleRelatedViews());
      expect(state.isCollapsed).to.equal(true);
      state = reducer(state, toggleRelatedViews());
      expect(state.isCollapsed).to.equal(false);
    });
  });
});
