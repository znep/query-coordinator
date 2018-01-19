import sinon from 'sinon';
import { expect, assert } from 'chai';
import { getDefaultStore } from 'testStore';
import * as http from 'common/http';
import reducer from 'catalogLandingPage/reducers/search';
import * as Actions from 'catalogLandingPage/actions/search';

describe('reducers/search', () => {
  let state;

  beforeEach(() => {
    state = reducer();
  });

  describe('CLEAR_SEARCH', () => {
    it('redirects to a page with the search query removed', () => {
      const mock = sinon.mock(http).expects('redirectToQueryString').once().withExactArgs('?');
      state = reducer(state, Actions.updateSearchTerm('Puppies!'));
      reducer(state, Actions.clearSearch());
      mock.verify();
      http.redirectToQueryString.restore();
    });
  });

  describe('PERFORM_SEARCH', () => {
    it('redirects to a page with the search term', () => {
      const mock = sinon.mock(http).expects('redirectToQueryString').once().withExactArgs('?q=shizzam');
      state = reducer(state, Actions.updateSearchTerm('shizzam'));
      reducer(state, Actions.performSearch());
      mock.verify();
      http.redirectToQueryString.restore();
    });
  });

  describe('UPDATE_SEARCH_TERM', () => {
    it('updates the search term', () => {
      state.term = '';
      state = reducer(state, Actions.updateSearchTerm('fun'));
      assert.equal(state.term, 'fun');
    });
  });
});
