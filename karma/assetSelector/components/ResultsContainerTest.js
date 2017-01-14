import { ResultsContainer } from 'components/ResultsContainer';
import $ from 'jquery';

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
      resultCount: 100,
      resultsPerPage: 6
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  beforeEach(() => {
    sinon.stub($, 'ajax', function(options) {
      var deferred = $.Deferred();
      if (options.success) deferred.done(options.success({ results: [] }));
      if (options.error) deferred.fail(options.error);

      deferred.success = deferred.done;
      deferred.error = deferred.fail;

      return deferred;
    });
  });

  afterEach(() => {
    $.ajax.restore();
  });

  it('renders the "no results" element if the results array is empty', function() {
    var element = renderComponentWithStore(ResultsContainer, getProps({ results: [] }));
    expect(element).to.exist;
    expect(element.className).to.eq('no-results');
  });

  it('renders the results container if the results array is present', function() {
    var element = renderComponentWithStore(ResultsContainer, getProps());
    expect(element).to.exist;
    expect(element.className).to.eq('results-container');
  });

  it('renders the total result count', function() {
    var element = renderComponentWithStore(ResultsContainer, getProps());
    expect(element.querySelector('.result-count').textContent).to.equal('1-6 of 100 Views');
  });

  it('renders the correct number of cards', function() {
    const results = defaultProps().results.slice(0);
    const originalResult = results[0];
    for (var i = 0; i < 8; i++) {
      results.push(originalResult)
    }
    var element = renderComponentWithStore(ResultsContainer, getProps({ results }));
    expect(element.querySelectorAll('.result-card').length).to.equal(9);
  });
});
