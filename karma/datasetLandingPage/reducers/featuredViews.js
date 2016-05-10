import { getDefaultStore } from 'testStore';
import mockFeaturedView from 'data/mockFeaturedView';
import reducer from 'reducers';
import {
  requestFeaturedViews,
  receiveFeaturedViews,
  handleFeaturedViewsError,
  dismissFeaturedViewsError,
  toggleFeaturedViews
} from 'actions';

describe('reducers/featuredViews', function() {
  beforeEach(function() {
    this.store = getDefaultStore();
    this.state = this.store.getState();
  });

  describe('REQUEST_FEATURED_VIEWS', function() {
    it('sets isLoading to true', function() {
      this.state.featuredViews.isLoading = false;

      var result = reducer(this.state, requestFeaturedViews());
      expect(result.featuredViews.isLoading).to.equal(true);
    });
  });

  describe('RECEIVE_FEATURED_VIEWS', function() {
    beforeEach(function() {
      this.state.isLoading = true;
      this.state.featuredViews.list = _.fill(Array(3), mockFeaturedView);
    });

    it('appends up to 3 elements to the list', function() {
      var payload = _.fill(Array(4), mockFeaturedView);
      var result = reducer(this.state, receiveFeaturedViews(payload));
      expect(result.featuredViews.list).to.have.length(6);
    });

    it('sets hasMore to true if there are more than 3 elements in the payload', function() {
      var payload = _.fill(Array(4), mockFeaturedView);
      var result = reducer(this.state, receiveFeaturedViews(payload));
      expect(result.featuredViews.hasMore).to.equal(true);
    });

    it('sets hasMore to false if there are less than 3 elements in the payload', function() {
      var payload = _.fill(Array(2), mockFeaturedView);
      var result = reducer(this.state, receiveFeaturedViews(payload));
      expect(result.featuredViews.hasMore).to.equal(false);
    });

    it('sets isLoading to false', function() {
      var result = reducer(this.state, receiveFeaturedViews([]));
      expect(result.featuredViews.isLoading).to.equal(false);
    });
  });

  describe('HANDLE_FEATURED_VIEWS_ERROR', function() {
    beforeEach(function() {
      this.state.isLoading = true;
      this.state.hasError = false;
    });

    it('sets isLoading to false', function() {
      var result = reducer(this.state, handleFeaturedViewsError());
      expect(result.featuredViews.isLoading).to.equal(false);
    });

    it('sets hasError to true', function() {
      var result = reducer(this.state, handleFeaturedViewsError());
      expect(result.featuredViews.hasError).to.equal(true);
    });
  });

  describe('DISMISS_FEATURED_VIEWS_ERROR', function() {
    beforeEach(function() {
      this.state.hasError = true;
    });

    it('sets hasError to false', function() {
      var result = reducer(this.state, dismissFeaturedViewsError());
      expect(result.featuredViews.hasError).to.equal(false);
    });
  });

  describe('TOGGLE_FEATURED_VIEWS', function() {
    beforeEach(function() {
      this.state.featuredViews.isCollapsed = false;
    });

    it('toggles isCollapsed', function() {
      var state = this.state;
      state = reducer(state, toggleFeaturedViews());
      expect(state.featuredViews.isCollapsed).to.equal(true);
      state = reducer(state, toggleFeaturedViews());
      expect(state.featuredViews.isCollapsed).to.equal(false);
    });
  });
});
