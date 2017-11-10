import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import mixpanel from 'common/mixpanel';

import {
  fetchResults,
  mergedCeteraQueryParameters
} from 'common/components/AssetBrowser/lib/helpers/cetera.js';
import getState from 'common/components/AssetBrowser/reducers/catalog';
import ceteraUtils from 'common/cetera/utils';
import {
  ALL_ASSETS_TAB,
  MY_ASSETS_TAB,
  SHARED_TO_ME_TAB
} from 'common/components/AssetBrowser/lib/constants';

import mockCeteraFacetCountsResponse from '../components/AssetBrowser/data/mock_cetera_facet_counts_response';
import mockCeteraFetchResponse from '../components/AssetBrowser/data/mock_cetera_fetch_response';

describe('cetera_helpers', () => {
  let ceteraStub;
  let ceteraAssetCountsStub;

  beforeEach(() => {
    ceteraStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(mockCeteraFetchResponse)));

    ceteraAssetCountsStub = sinon.stub(ceteraUtils, 'facetCountsQuery').
      callsFake(_.constant(Promise.resolve(mockCeteraFacetCountsResponse)));
  });

  afterEach(() => {
    ceteraStub.restore();
    ceteraAssetCountsStub.restore();
  });

  describe('mergedCeteraQueryParameters', () => {
    describe('baseFilters', () => {
      it('overrides normal filters', () => {
        const state = () => ({
          header: {
            activeTab: ALL_ASSETS_TAB
          },
          tabs: {
            [ALL_ASSETS_TAB]: {
              props: {
                baseFilters: {
                  assetTypes: 'charts',
                  forUser: 'abcd-1234'
                }
              }
            }
          }
        });
        const parameters = {
          assetTypes: 'datasets',
          forUser: 'efgh-5678',
          q: 'foo'
        };

        const result = mergedCeteraQueryParameters(state, parameters);
        assert.equal(result.only, 'charts');
        assert.equal(result.forUser, 'abcd-1234');
        assert.equal(result.q, 'foo');
      });
    });

    it('adds custom facet filters', () => {
      const parameters = { customFacets: { Foo_Bar: 'abcd' } };
      const result = mergedCeteraQueryParameters(getState, parameters);
      assert.deepEqual(result.customMetadataFilters, { Foo_Bar: 'abcd' });
    });

    it('overrides an existing custom facet filter', () => {
      const state = () => ({ filters: { customFacets: { Foo_Bar: 'some existing value' } } });
      const parameters = { customFacets: { Foo_Bar: null } };
      const result = mergedCeteraQueryParameters(state, parameters);
      assert.deepEqual(result.customMetadataFilters, { Foo_Bar: null });
    });

    it('can have multiple custom facet filters', () => {
      const state = () => ({ filters: { customFacets: { Foo_Bar: 'some existing value' } } });
      const parameters = { customFacets: { Foo_Bar2: 'another value' } };
      const result = mergedCeteraQueryParameters(state, parameters);
      assert.deepEqual(result.customMetadataFilters, { Foo_Bar: 'some existing value', Foo_Bar2: 'another value' });
    });
  });

  // fetchResults returns a promise
  describe('fetchResults', () => {
    let ceteraUtilsQuerySpy;
    let mixpanelSendPayloadSpy;

    beforeEach(() => {
      ceteraUtilsQuerySpy = sinon.spy(ceteraUtils, 'query');
      mixpanelSendPayloadSpy = sinon.spy(mixpanel, 'sendPayload');
    });

    afterEach(() => {
      ceteraUtilsQuerySpy.restore();
      mixpanelSendPayloadSpy.restore();
    });

    describe('mixpanelContext', () => {

      // Returns a promise
      it('includes the mixpanelContext param for reporting metrics', () => {
        const dispatch = () => {};
        const onSuccess = () => {};
        const parameters = {
          action: 'TOGGLE_RECENTLY_VIEWED',
          pageNumber: 1,
          onlyRecentlyViewed: true,
          results: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        };

        return fetchResults(dispatch, getState, parameters, onSuccess).then((response) => {
          const mixpanelContext = ceteraUtils.query.getCall(0).args[0].mixpanelContext;

          assert.equal(mixpanelContext.eventName, 'Filtered Assets to Only Recently Viewed');
          assert.equal(Object.keys(mixpanelContext.params).length, 3);
          assert(_.includes(Object.keys(mixpanelContext.params), 'results', 'pageNumber', 'onlyRecentlyViewed'));
          assert.equal(mixpanelContext.params.pageNumber, 1);
          assert(mixpanelContext.params.onlyRecentlyViewed);
          // Confirm that we don't send the entire collection of results to mixpanel
          assert(!_.includes(Object.keys(mixpanel.sendPayload.getCall(0).args[1]), 'results'));
        });
      });

    });

  });

});
