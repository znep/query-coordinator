import sinon from 'sinon';
import { expect, assert } from 'chai';
import 'babel-polyfill';
import _ from 'lodash';
import { ResultsContainer } from 'components/assetSelector/ResultsContainer';

import ceteraUtils from 'ceteraUtils';
import mockCeteraResponse from 'assetSelector/data/mockCeteraResponse';

describe('ResultsContainer', function() {
  const defaultProps = {
    additionalTopbarComponents: [],
    category: 'Education',
    onClose: _.noop,
    onSelect: _.noop,
    resultsPerPage: 6
  };

  function getProps(props = {}) {
    return {...defaultProps, ...props};
  }

  function stubFetch(ceteraResponse = { results: [], resultSetSize: 0 }) {
    sinon.stub(ceteraUtils, 'fetch').callsFake(_.constant(Promise.resolve({
      results: ceteraResponse.results,
      resultSetSize: ceteraResponse.resultSetSize
    })));
  }

  it('renders', function() {
    stubFetch();
    var element = renderComponent(ResultsContainer);
    assert.isDefined(element);
    assert.match(element.className, /results-container/);
    ceteraUtils.fetch.restore();
  });

  describe('result cards', function() {
    afterEach(() => {
      ceteraUtils.fetch.restore();
    });

    it('renders the "no results" element if the results array is empty', function(done) {
      stubFetch({ results: [], resultSetSize: 0 });
      var element = renderComponent(ResultsContainer);

      _.defer(() => {
        assert.isNotNull(element.querySelector('.no-results'));
        done();
      });
    });

    it('renders the results container if the results array is present', function(done) {
      stubFetch(mockCeteraResponse);
      var element = renderComponent(ResultsContainer);

      _.defer(() => {
        assert.isDefined(element);
        assert.isNotNull(element.querySelector('.card-container'));
        done();
      });
    });

    it('renders the total result count', function(done) {
      stubFetch(mockCeteraResponse);
      var element = renderComponent(ResultsContainer);

      _.defer(() => {
        assert.equal(element.querySelector('.result-count').textContent, '1-6 of 16 Views');
        done();
      });
    });

    it('renders the correct number of cards', function(done) {
      stubFetch(mockCeteraResponse);
      var element = renderComponent(ResultsContainer);

      _.defer(() => {
        assert.equal(element.querySelectorAll('.result-card').length, 6);
        done();
      });
    });
  });

  describe('additionalTopbarComponents', function() {
    it('can be an empty array', function() {
      var element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: []
      }));
      assert.isDefined(element);
    });

    it('renders an additional component in the topbar', function() {
      var testComponent = React.createElement('div', { className: 'test', key: 0 });
      var element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: [testComponent]
      }));

      assert.isNotNull(element.querySelector('.results-topbar').querySelector('.test'));
    });

    it('renders multiple additional components in the topbar', function() {
      var testComponent1 = React.createElement('div', { className: 'test1', key: 0 });
      var testComponent2 = React.createElement('div', { className: 'test2', key: 1 });
      var testComponent3 = React.createElement('div', { className: 'test3', key: 2 });
      var element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: [testComponent1, testComponent2, testComponent3]
      }));

      assert.isNotNull(element.querySelector('.results-topbar').querySelector('.test1'));
      assert.isNotNull(element.querySelector('.results-topbar').querySelector('.test2'));
      assert.isNotNull(element.querySelector('.results-topbar').querySelector('.test3'));
    });
  });
});
