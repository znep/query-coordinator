import { ResultsContainer } from 'components/ResultsContainer';
import $ from 'jquery';
import ceteraUtils from 'lib/ceteraUtils';
import mockCeteraResponse from 'data/mockCeteraResponse';

describe('components/ResultsContainer', function() {

  function defaultProps() {
    return {
      additionalTopbarComponents: [],
      category: 'Education',
      onClose: _.noop,
      onSelect: _.noop,
      resultsPerPage: 6
    };
  }

  function getProps(props = {}) {
    return {...defaultProps(), ...props};
  }

  function stubFetch(ceteraResponse = { results: [], resultSetSize: 0 }) {
    sinon.stub(ceteraUtils, 'fetch', function(options) {
      var deferred = $.Deferred();
      deferred.then = deferred.done;
      deferred.catch = deferred.fail;

      deferred.resolve({
        results: ceteraResponse.results,
        resultSetSize: ceteraResponse.resultSetSize
      });

      return deferred;
    });
  }

  describe('result cards', function() {
    afterEach(() => {
      ceteraUtils.fetch.restore();
    });

    it('renders', function() {
      stubFetch();
      var element = renderComponent(ResultsContainer);
      expect(element).to.exist;
      expect(element.className).to.match(/results-container/);
    });

    it('renders the "no results" element if the results array is empty', function() {
      stubFetch({ results: [], resultSetSize: 0 });
      var element = renderComponent(ResultsContainer);
      expect(element.querySelector('.no-results')).to.exist;
    });

    it('renders the results container if the results array is present', function() {
      stubFetch(mockCeteraResponse);
      var element = renderComponent(ResultsContainer);
      expect(element).to.exist;
      expect(element.querySelector('.card-container')).to.exist;
    });

    it('renders the total result count', function() {
      stubFetch(mockCeteraResponse);
      var element = renderComponent(ResultsContainer);
      expect(element.querySelector('.result-count').textContent).to.equal('1-6 of 16 Views');
    });

    it('renders the correct number of cards', function() {
      stubFetch(mockCeteraResponse);
      var element = renderComponent(ResultsContainer);
      expect(element.querySelectorAll('.result-card').length).to.equal(6);
    });
  });

  describe('additionalTopbarComponents', function() {
    it('can be an empty array', function() {
      var element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: []
      }));
      expect(element).to.exist;
    });

    it('renders an additional component in the topbar', function() {
      var testComponent = React.createElement('div', { className: 'test', key: 0 });
      var element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: [testComponent]
      }));

      expect(element.querySelector('.results-topbar').querySelector('.test')).to.exist;
    });

    it('renders multiple additional components in the topbar', function() {
      var testComponent1 = React.createElement('div', { className: 'test1', key: 0 });
      var testComponent2 = React.createElement('div', { className: 'test2', key: 1 });
      var testComponent3 = React.createElement('div', { className: 'test3', key: 2 });
      var element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: [testComponent1, testComponent2, testComponent3]
      }));

      expect(element.querySelector('.results-topbar').querySelector('.test1')).to.exist;
      expect(element.querySelector('.results-topbar').querySelector('.test2')).to.exist;
      expect(element.querySelector('.results-topbar').querySelector('.test3')).to.exist;
    });
  });
});
