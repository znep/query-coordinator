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
    expect(element.querySelector('input')).to.exist;
  });

  it('contains the search term', function() {
    var element = renderComponent(Search, searchProps({term: 'find me'}));
    var input = element.querySelector('input');
    expect(input).to.exist;
    expect(input.value).to.equal('find me');
  });

  it('focuses the search input', function() {
    var element = renderComponent(Search, searchProps());
    var input = element.querySelector('input');
    expect(input).to.exist;
    _.defer(function() {
      expect(input).to.equal(document.activeElement);
    })
  });
});
