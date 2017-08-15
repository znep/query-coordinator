import reducer from 'common/autocomplete/reducers/StatefulAutocompleteReducer'
import * as actions from 'common/autocomplete/actions'

describe('autocomplete reducer', () => {
  const someResults = {
    results: [
      { title: 'Birds', display_title: '<span>Birds</span>' },
      { title: 'Not Birds', display_title: 'Not <span>Birds</span>' },
      { title: 'Maybe Birds', display_title: 'Maybe <span>Birds</span>' }
    ]
  };

  describe('query changed', () => {
    it('should handle query changed', () => {
      const expectedState = {
        query: 'Birds',
        searchResults: undefined
      };
      const reducedState = reducer({}, actions.queryChanged('Birds'));
      expect(reducedState).to.eql(expectedState);
    });

    it('should blank out results if query is empty', () => {
      const initialState = {
        query: 'Birds',
        searchResults: someResults
      };
      const expectedState = {
        query: '',
        searchResults: {}
      };
      const reducedState = reducer(initialState, actions.queryChanged(''));
      expect(reducedState).to.eql(expectedState);
    });
  });

  describe('results changed', () => {
    it('should handle results changed', () => {
      const expectedState = {
        query: 'Birds',
        searchResults: someResults,
        resultsVisible: true
      };
      const reducedState = reducer({ query: 'Birds' }, actions.resultsChanged(someResults));
      expect(reducedState).to.eql(expectedState);
    });

    it('ignores results if query is empty', () => {
      const expectedState = {
        query: '',
        searchResults: { results: [] },
        resultsVisible: false
      };
      const reducedState = reducer({ query: '' }, actions.resultsChanged(someResults));
      expect(reducedState).to.eql(expectedState);
    });
  });

  describe('results visibility', () => {
    it('should handle visibility changed', () => {
      const initialState = {
        resultsVisible: false
      };
      const expectedState = {
        resultsVisible: true,
        collapsed: undefined,
        focusedResult: undefined
      };
      const reducedState = reducer(initialState, actions.resultVisibilityChanged(true));
      expect(reducedState).to.eql(expectedState);
    });

    it('should un-focus and collapse when hiding results', () => {
      const initialState = {
        resultsVisible: true,
        focusedResult: 5,
        collapsed: false
      };
      const expectedState = {
        resultsVisible: false,
        focusedResult: undefined,
        collapsed: true
      };
      const reducedState = reducer(initialState, actions.resultVisibilityChanged(false));
      expect(reducedState).to.eql(expectedState);
    });
  });

  describe('results focus', () => {
    it('should not go below 0 when changing focused result', () => {
      const initialState = {
        searchResults: someResults,
        focusedResult: 3
      };
      const expectedState = {
        searchResults: someResults,
        focusedResult: undefined
      };
      const reducedState = reducer(initialState, actions.resultFocusChanged(-1));
      expect(reducedState).to.eql(expectedState);
    });

    it('should blank out focused result when there are no search results', () => {
      const expectedState = {
        focusedResult: undefined
      };
      const reducedState = reducer({}, actions.resultFocusChanged(1));
      expect(reducedState).to.eql(expectedState);
    });

    it('should not go beyond the results list when changing focused reuslt', () => {
      const initialState = {
        searchResults: someResults
      };
      const expectedState = {
        searchResults: someResults,
        focusedResult: someResults.results.length - 1
      };
      const reducedState = reducer(initialState, actions.resultFocusChanged(5000));
      expect(reducedState).to.eql(expectedState);
    });

    it('changes the focused result', () => {
      const initialState = {
        searchResults: someResults,
        focusedResult: 2
      };
      const expectedState = {
        searchResults: someResults,
        focusedResult: 1
      };
      const reducedState = reducer(initialState, actions.resultFocusChanged(1));
      expect(reducedState).to.eql(expectedState);
    });
  });

  describe('collapse', () => {
    it('blanks out focused result when collapsing', () => {
      const initialState = {
        collapsed: false,
        focusedResult: 2
      };
      const expectedState = {
        collapsed: true,
        focusedResult: undefined
      };
      const reducedState = reducer(initialState, actions.collapseChanged(true));
      expect(reducedState).to.eql(expectedState);
    });
  })
})
