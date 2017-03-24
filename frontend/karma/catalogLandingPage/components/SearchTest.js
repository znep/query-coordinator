import { Search } from 'components/Search';

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
    expect(input.value).to.equal('find me');
  });

  it('focuses the search input', function() {
    var element = renderComponent(Search, searchProps());
    var input = element.querySelector('input');
    assert.isNotNull(input);
    _.defer(function() {
      expect(input).to.equal(document.activeElement);
    })
  });
});
