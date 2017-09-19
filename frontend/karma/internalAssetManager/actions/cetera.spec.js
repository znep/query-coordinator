import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { ceteraUtilsParams, fetchResults } from 'actions/cetera';
import getState from 'reducers/catalog';
import ceteraUtils from 'common/cetera_utils';
import mockCeteraFacetCountsResponse from 'data/mock_cetera_facet_counts_response';

import mockCeteraFetchResponse from '../../internalAssetManager/data/mock_cetera_fetch_response.js';

describe('cetera.js', () => {
  let ceteraStub;
  let ceteraAssetCountsStub;

  beforeEach(() => {
    ceteraStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(mockCeteraFetchResponse)));

    ceteraAssetCountsStub = sinon.stub(ceteraUtils, 'facetCountsQuery').
      callsFake(_.constant(Promise.resolve(mockCeteraFacetCountsResponse)));
  });

  afterEach(() => {
    ceteraStub.restore()
    ceteraAssetCountsStub.restore();
  });

  describe('ceteraUtilsParams', () => {
    it('does not have a sharedTo filter if activeTab is null', () => {
      const parameters = { activeTab: null };
      const result = ceteraUtilsParams(getState, parameters);
      assert.isUndefined(result.sharedTo);
    });

    it('does not have a sharedTo filter if activeTab is "All Assets"', () => {
      const parameters = { activeTab: 'allAssets' };
      const result = ceteraUtilsParams(getState, parameters);
      assert.isUndefined(result.sharedTo);
    });

    it('does not have a sharedTo filter if activeTab is "My Assets"', () => {
      const parameters = { activeTab: 'myAssets' };
      const result = ceteraUtilsParams(getState, parameters);
      assert.isUndefined(result.sharedTo);
    });

    it('does have a sharedTo filter if activeTab is "Shared To Me"', () => {
      window.serverConfig.currentUser = { 'id': 'abcd-1234' };

      const parameters = { activeTab: 'sharedToMe' };
      const result = ceteraUtilsParams(getState, parameters);
      assert.equal(result.sharedTo, 'abcd-1234');
    });

    it('does not have a forUser filter if activeTab is null', () => {
      const parameters = { activeTab: null };
      const result = ceteraUtilsParams(getState, parameters);
      assert.isUndefined(result.forUser);
    });

    it('does not have a forUser filter if activeTab is "All Assets"', () => {
      const parameters = { activeTab: 'allAssets' };
      const result = ceteraUtilsParams(getState, parameters);
      assert.isUndefined(result.forUser);
    });

    it('does not have a forUser filter if activeTab is "Shared To Me"', () => {
      const parameters = { activeTab: 'sharedToMe' };
      const result = ceteraUtilsParams(getState, parameters);
      assert.isUndefined(result.forUser);
    });

    it('does have a forUser filter if activeTab is "My Assets"', () => {
      window.serverConfig.currentUser = { 'id': 'abcd-1234' };

      const parameters = { activeTab: 'myAssets' };
      const result = ceteraUtilsParams(getState, parameters);
      assert.equal(result.forUser, 'abcd-1234');
    });

    it('adds custom facet filters', () => {
      const parameters = { customFacets: { Foo_Bar: 'abcd' } };
      const result = ceteraUtilsParams(getState, parameters);
      assert.deepEqual(result.customMetadataFilters, { Foo_Bar: 'abcd' });
    });

    it('overrides an existing custom facet filter', () => {
      const state = () => ({ filters: { customFacets: { Foo_Bar: 'some existing value' } } });
      const parameters = { customFacets: { Foo_Bar: null } };
      const result = ceteraUtilsParams(state, parameters);
      assert.deepEqual(result.customMetadataFilters, { Foo_Bar: null });
    });

    it('can have multiple custom facet filters', () => {
      const state = () => ({ filters: { customFacets: { Foo_Bar: 'some existing value' } } });
      const parameters = { customFacets: { Foo_Bar2: 'another value' } };
      const result = ceteraUtilsParams(state, parameters);
      assert.deepEqual(result.customMetadataFilters, { Foo_Bar: 'some existing value', Foo_Bar2: 'another value' });
    });
  });

  // fetchResults returns a promise
  describe('fetchResults', () => {
    let ceteraUtilsQuerySpy;

    beforeEach(() => ceteraUtilsQuerySpy = sinon.spy(ceteraUtils, 'query'));

    afterEach(() => ceteraUtilsQuerySpy.restore());

    describe('mixpanelContext', () => {

      // Returns a promise
      it('includes the mixpanelContext param for reporting metrics', () => {
        const dispatch = () => {};
        const onSuccess = () => {};
        const parameters = { action: 'TOGGLE_RECENTLY_VIEWED', pageNumber: 1, onlyRecentlyViewed: true };

        return fetchResults(dispatch, getState, parameters, onSuccess).then((response) => {
          const mixpanelContext = ceteraUtils.query.getCall(0).args[0].mixpanelContext;

          assert.equal(mixpanelContext.eventName, 'Filtered Assets to Only Recently Viewed');
          assert.equal(Object.keys(mixpanelContext.params).length, 2);
          assert(_.includes(Object.keys(mixpanelContext.params), 'pageNumber', 'onlyRecentlyViewed'));
          assert.equal(mixpanelContext.params.pageNumber, 1);
          assert(mixpanelContext.params.onlyRecentlyViewed);
        });
      });

    });

  });

});
