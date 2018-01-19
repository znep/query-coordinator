import { expect, assert } from 'chai';
import { Search } from 'catalogLandingPage/components/Search';

describe('components/Search', function() {
  function searchProps(options) {
    return {
      term: '',
      performSearch: function() {},
      updateSearchTerm: function() {},
      clearSearch: function() {},
      ...options
    };
  }

  it('renders a search input', function() {
    var element = renderComponent(Search, searchProps());
    assert.isNotNull(element.querySelector('input'));
  });

  it('contains the search term', function() {
    var element = renderComponent(Search, searchProps({term: 'find me'}));
    var input = element.querySelector('input');
    assert.isNotNull(input);
    assert.equal('find me', input.value, 'Value of search input should be "find me"');
  });
});
