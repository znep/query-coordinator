import sinon from 'sinon';
import { expect, assert } from 'chai';
import 'babel-polyfill';
import _ from 'lodash';
import { ResultsContainer } from 'components/assetSelector/ResultsContainer';

import ceteraUtils from 'common/cetera/utils';
import mockCeteraResponse from 'assetSelector/data/mockCeteraResponse';

describe('ResultsContainer', () => {
  const defaultProps = {
    additionalTopbarComponents: [],
    catalogQuery: {
      category: 'Education'
    },
    onClose: _.noop,
    onSelect: _.noop,
    resultsPerPage: 6
  };

  const getProps = (props = {}) => {
    return {...defaultProps, ...props};
  };

  const stubCeteraQuery = (ceteraResponse = { results: [], resultSetSize: 0 }) => (
    sinon.stub(ceteraUtils, 'query').callsFake(_.constant(Promise.resolve({
      results: ceteraResponse.results,
      resultSetSize: ceteraResponse.resultSetSize
    })))
  );

  it('renders', () => {
    stubCeteraQuery();
    const element = renderComponent(ResultsContainer, getProps());
    assert.isDefined(element);
    assert.match(element.className, /results-container/);
    ceteraUtils.query.restore();
  });

  describe('result cards', () => {
    afterEach(() => {
      ceteraUtils.query.restore();
    });

    it('renders the "no results" element if the results array is empty', (done) => {
      stubCeteraQuery({ results: [], resultSetSize: 0 });
      const element = renderComponent(ResultsContainer, getProps());

      _.defer(() => {
        assert.isNotNull(element.querySelector('.no-results'));
        done();
      });
    });

    it('renders the results container if the results array is present', (done) => {
      stubCeteraQuery(mockCeteraResponse);
      const element = renderComponent(ResultsContainer, getProps());

      _.defer(() => {
        assert.isDefined(element);
        assert.isNotNull(element.querySelector('.card-container'));
        done();
      });
    });

    it('renders the total result count', (done) => {
      stubCeteraQuery(mockCeteraResponse);
      const element = renderComponent(ResultsContainer, getProps());

      _.defer(() => {
        assert.equal(element.querySelector('.result-count').textContent, '1-6 of 16 Results');
        done();
      });
    });

    it('renders the correct number of cards', (done) => {
      stubCeteraQuery(mockCeteraResponse);
      const element = renderComponent(ResultsContainer, getProps());

      _.defer(() => {
        assert.equal(element.querySelectorAll('.result-card').length, 6);
        done();
      });
    });
  });

  describe('additionalTopbarComponents', () => {
    beforeEach(() => {
      stubCeteraQuery();
    });

    afterEach(() => {
      ceteraUtils.query.restore();
    });

    it('can be an empty array', () => {
      const element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: []
      }));
      assert.isDefined(element);
    });

    it('renders an additional component in the topbar', () => {
      const testComponent = React.createElement('div', { className: 'test', key: 0 });
      const element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: [testComponent]
      }));

      assert.isNotNull(element.querySelector('.results-topbar').querySelector('.test'));
    });

    it('renders multiple additional components in the topbar', () => {
      const testComponent1 = React.createElement('div', { className: 'test1', key: 0 });
      const testComponent2 = React.createElement('div', { className: 'test2', key: 1 });
      const testComponent3 = React.createElement('div', { className: 'test3', key: 2 });
      const element = renderComponent(ResultsContainer, getProps({
        additionalTopbarComponents: [testComponent1, testComponent2, testComponent3]
      }));

      assert.isNotNull(element.querySelector('.results-topbar').querySelector('.test1'));
      assert.isNotNull(element.querySelector('.results-topbar').querySelector('.test2'));
      assert.isNotNull(element.querySelector('.results-topbar').querySelector('.test3'));
    });
  });

  describe('when invoking ceteraUtils #query', () => {
    const fetchDefaultOptions = {
      category: undefined,
      customMetadataFilters: {},
      limit: 6,
      only: undefined,
      order: 'relevance',
      pageNumber: 1,
      q: undefined
    };

    afterEach(() => {
      ceteraUtils.query.restore();
    });

    it('is called with a category filter if catalogQuery is a category', () => {
      const stub = stubCeteraQuery();
      const element = renderComponent(ResultsContainer, getProps({
        catalogQuery: { category: 'Dogs' }
      }));

      assert(stub.calledWith({
        ...fetchDefaultOptions,
        category: 'Dogs'
      }));
    });

    it('is called with an only filter if catalogQuery is a limitTo', () => {
      const stub = stubCeteraQuery();
      const element = renderComponent(ResultsContainer, getProps({
        catalogQuery: { limitTo: 'datasets' }
      }));

      assert(stub.calledWith({
        ...fetchDefaultOptions,
        only: 'datasets'
      }));
    });

    it('is called with a custom metadata filter if catalogQuery is custom metadata', () => {
      const stub = stubCeteraQuery();
      const element = renderComponent(ResultsContainer, getProps({
        catalogQuery: { someCustomThing: 'abcdefg' }
      }));

      assert(stub.calledWith({
        ...fetchDefaultOptions,
        customMetadataFilters: { someCustomThing: 'abcdefg' }
      }));
    });
  });
});
