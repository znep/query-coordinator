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
      deferred.success = deferred.done;
      deferred.error = deferred.fail;

      deferred.resolve({
        results: [],
        resultSetSize: 0
      });

      return deferred;
    });
  });

  afterEach(() => {
    $.ajax.restore();
  });

  it('renders', function() {
    var element = renderComponentWithStore(ResultsContainer, getProps());
    expect(element).to.exist;
    expect(element.className).to.match(/results-container/);
  });

  it('renders the "no results" element if the results array is empty', function() {
    var element = renderComponentWithStore(ResultsContainer, getProps({ results: [] }));
    expect(element.querySelector('.no-results')).to.exist;
  });

  it('renders the results container if the results array is present', function() {
    var element = renderComponentWithStore(ResultsContainer, getProps());
    expect(element).to.exist;
    expect(element.querySelector('.card-container')).to.exist;
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

  describe('additionalTopbarComponents', function() {
    it('can be an empty array', function() {
      var element = renderComponentWithStore(ResultsContainer, getProps({
        additionalTopbarComponents: []
      }));
      expect(element).to.exist;
    });

    it('renders an additional component in the topbar', function() {
      var testComponent = React.createElement('div', { className: 'test', key: 0 });
      var element = renderComponentWithStore(ResultsContainer, getProps({
        additionalTopbarComponents: [testComponent]
      }));

      expect(element.querySelector('.results-topbar').querySelector('.test')).to.exist;
    });

    it('renders multiple additional components in the topbar', function() {
      var testComponent1 = React.createElement('div', { className: 'test1', key: 0 });
      var testComponent2 = React.createElement('div', { className: 'test2', key: 1 });
      var testComponent3 = React.createElement('div', { className: 'test3', key: 2 });
      var element = renderComponentWithStore(ResultsContainer, getProps({
        additionalTopbarComponents: [testComponent1, testComponent2, testComponent3]
      }));

      expect(element.querySelector('.results-topbar').querySelector('.test1')).to.exist;
      expect(element.querySelector('.results-topbar').querySelector('.test2')).to.exist;
      expect(element.querySelector('.results-topbar').querySelector('.test3')).to.exist;
    });
  });
});
