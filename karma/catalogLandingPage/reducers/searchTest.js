import { getDefaultStore } from 'testStore';
import reducer from 'reducers/search';
import { updateSearchTerm } from 'actions/search';

describe('reducers/search', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('CLEAR_SEARCH', function() {
    it('redirects to a page with no search', function() {
      // TODO
    });
  });

  describe('PERFORM_SEARCH', function() {
    it('redirects to a page with the search term', function() {
      // TODO
    });
  });

  describe('UPDATE_SEARCH_TERM', function() {
    it('updates the search term', function() {
      state.term = '';
      var result = reducer(state, updateSearchTerm('fun'))
      expect(result.term).to.equal('fun');
    });
  });
});
