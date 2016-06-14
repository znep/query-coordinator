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
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('REQUEST_POPULAR_VIEWS', function() {
    it('sets isLoading to true', function() {
      state.isLoading = false;
      state = reducer(state, requestPopularViews());
      expect(state.isLoading).to.equal(true);
    });
  });

  describe('RECEIVE_POPULAR_VIEWS', function() {
    beforeEach(function() {
      state.isLoading = true;
      state.viewList = _.fill(Array(3), mockViewWidget);
    });

    it('appends up to 3 elements to the viewList', function() {
      var payload = _.fill(Array(4), mockViewWidget);
      state = reducer(state, receivePopularViews(payload));
      expect(state.viewList).to.have.length(6);
    });

    it('sets hasMore to true if there are more than 3 elements in the payload', function() {
      var payload = _.fill(Array(4), mockViewWidget);
      state = reducer(state, receivePopularViews(payload));
      expect(state.hasMore).to.equal(true);
    });

    it('sets hasMore to false if there are less than 3 elements in the payload', function() {
      var payload = _.fill(Array(2), mockViewWidget);
      state = reducer(state, receivePopularViews(payload));
      expect(state.hasMore).to.equal(false);
    });

    it('sets hasError to false', function() {
      state.hasError = true;
      var payload = _.fill(Array(2), mockViewWidget);
      state = reducer(state, receivePopularViews(payload));
      expect(state.hasError).to.equal(false);
    });

    it('sets isLoading to false', function() {
      state = reducer(state, receivePopularViews([]));
      expect(state.isLoading).to.equal(false);
    });
  });

  describe('HANDLE_POPULAR_VIEWS_ERROR', function() {
    beforeEach(function() {
      state.isLoading = true;
      state.hasError = false;
    });

    it('sets isLoading to false', function() {
      state = reducer(state, handlePopularViewsError());
      expect(state.isLoading).to.equal(false);
    });

    it('sets hasError to true', function() {
      state = reducer(state, handlePopularViewsError());
      expect(state.hasError).to.equal(true);
    });
  });

  describe('DISMISS_POPULAR_VIEWS_ERROR', function() {
    beforeEach(function() {
      state.hasError = true;
    });

    it('sets hasError to false', function() {
      state = reducer(state, dismissPopularViewsError());
      expect(state.hasError).to.equal(false);
    });
  });

  describe('TOGGLE_POPULAR_VIEWS', function() {
    it('toggles isCollapsed', function() {
      state.isCollapsed = false;
      state = reducer(state, togglePopularViews());
      expect(state.isCollapsed).to.equal(true);
      state = reducer(state, togglePopularViews());
      expect(state.isCollapsed).to.equal(false);
    });
  });
});
