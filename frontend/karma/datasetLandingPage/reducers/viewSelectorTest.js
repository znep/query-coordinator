import { expect, assert } from 'chai';
import { getDefaultStore } from 'testStore';
import reducer from 'datasetLandingPage/reducers/featuredContent/viewSelector.js';
import {
  setSavingFeaturedItem,
  requestDerivedViews,
  requestedDerivedViews,
  receiveDerivedViews,
  handleDerivedViewsError
} from 'datasetLandingPage/actions/featuredContent';

describe('reducers/featuredContent/viewSelector', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('requestDerivedViews', function() {
    it('calls requestedDerivedViews', function() {

    });
  });

  describe('REQUESTED_DERIVED_VIEWS', function() {
    it('sets isLoading to true', function() {
      expect(state.isLoading).to.equal(false);
      state = reducer(state, requestedDerivedViews());
      expect(state.isLoading).to.equal(true);
    });
  })

  describe('HANDLE_DERIVED_VIEWS_REQUEST_ERROR', function() {
    it('sets isLoading to false', function() {
      state.isLoading = true;
      state = reducer(state, handleDerivedViewsError());
      expect(state.isLoading).to.equal(false);
    });

    it('sets hasError to true', function() {
      expect(state.hasError).to.equal(false);
      state = reducer(state, handleDerivedViewsError());
      expect(state.hasError).to.equal(true);
    });
  });

  describe('RECEIVE_DERIVED_VIEWS', function() {
    it('sets isLoading to false', function() {
      state.isLoading = true;
      state = reducer(state, receiveDerivedViews());
      expect(state.isLoading).to.equal(false);
    });
  });
});
