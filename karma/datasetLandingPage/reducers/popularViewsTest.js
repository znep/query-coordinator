import { getDefaultStore } from 'testStore';
import mockViewWidget from 'data/mockViewWidget';
import reducer from 'reducers/popularViews';
import {
  requestPopularViews,
  receivePopularViews,
  handlePopularViewsError,
  dismissPopularViewsError,
  togglePopularViews
} from 'actions/popularViews';

describe('reducers/popularViews', function() {
  beforeEach(function() {
    this.state = reducer();
  });

  describe('REQUEST_POPULAR_VIEWS', function() {
    it('sets isLoading to true', function() {
      this.state.isLoading = false;

      var result = reducer(this.state, requestPopularViews());
      expect(result.isLoading).to.equal(true);
    });
  });

  describe('RECEIVE_POPULAR_VIEWS', function() {
    beforeEach(function() {
      this.state.isLoading = true;
      this.state.viewList = _.fill(Array(3), mockViewWidget);
    });

    it('appends up to 3 elements to the viewList', function() {
      var payload = _.fill(Array(4), mockViewWidget);
      var result = reducer(this.state, receivePopularViews(payload));
      expect(result.viewList).to.have.length(6);
    });

    it('sets hasMore to true if there are more than 3 elements in the payload', function() {
      var payload = _.fill(Array(4), mockViewWidget);
      var result = reducer(this.state, receivePopularViews(payload));
      expect(result.hasMore).to.equal(true);
    });

    it('sets hasMore to false if there are less than 3 elements in the payload', function() {
      var payload = _.fill(Array(2), mockViewWidget);
      var result = reducer(this.state, receivePopularViews(payload));
      expect(result.hasMore).to.equal(false);
    });

    it('sets hasError to false', function() {
      this.state.hasError = true;
      var payload = _.fill(Array(2), mockViewWidget);
      var result = reducer(this.state, receivePopularViews(payload));
      expect(result.hasError).to.equal(false);
    });

    it('sets isLoading to false', function() {
      var result = reducer(this.state, receivePopularViews([]));
      expect(result.isLoading).to.equal(false);
    });
  });

  describe('HANDLE_POPULAR_VIEWS_ERROR', function() {
    beforeEach(function() {
      this.state.isLoading = true;
      this.state.hasError = false;
    });

    it('sets isLoading to false', function() {
      var result = reducer(this.state, handlePopularViewsError());
      expect(result.isLoading).to.equal(false);
    });

    it('sets hasError to true', function() {
      var result = reducer(this.state, handlePopularViewsError());
      expect(result.hasError).to.equal(true);
    });
  });

  describe('DISMISS_POPULAR_VIEWS_ERROR', function() {
    beforeEach(function() {
      this.state.hasError = true;
    });

    it('sets hasError to false', function() {
      var result = reducer(this.state, dismissPopularViewsError());
      expect(result.hasError).to.equal(false);
    });
  });

  describe('TOGGLE_POPULAR_VIEWS', function() {
    beforeEach(function() {
      this.state.isCollapsed = false;
    });

    it('toggles isCollapsed', function() {
      var state = this.state;
      state = reducer(state, togglePopularViews());
      expect(state.isCollapsed).to.equal(true);
      state = reducer(state, togglePopularViews());
      expect(state.isCollapsed).to.equal(false);
    });
  });
});
