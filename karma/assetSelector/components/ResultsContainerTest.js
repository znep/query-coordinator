import { ResultsContainer } from 'components/ResultsContainer';

describe('components/ResultsContainer', function() {
  function defaultProps() {
    return {
      results: [
        {
          id: 'abcd-1234',
          name: 'test view',
          description: 'test view description',
          type: 'dataset',
          link: 'https://localhost/A/B/abcd-1234'
        }
      ],
      viewCount: 100,
      viewType: 'CARD_VIEW'
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders the "no results" element if the results array is empty', function() {
    var element = renderComponent(ResultsContainer, getProps({ results: [] }));
    expect(element).to.exist;
    expect(element.className).to.eq('no-results');
  });

  it('renders the results container if the results array is present', function() {
    var element = renderComponent(ResultsContainer, getProps());
    expect(element).to.exist;
    expect(element.className).to.eq('results-container');
  });

  it('renders a cards container if the viewType prop is CARD_VIEW', function() {
    var element = renderComponent(ResultsContainer, getProps({ viewType: 'CARD_VIEW' }));
    expect(element.querySelector('.card-container')).to.exist;
  });

  it('renders a table container if the viewType prop is TABLE_VIEW', function() {
    var element = renderComponent(ResultsContainer, getProps({ viewType: 'TABLE_VIEW' }));
    expect(element.querySelector('.table-container')).to.exist;
  });
});
