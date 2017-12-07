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

import * as filterActions from 'common/components/AssetBrowser/actions/filters';

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

      it('handles an array of approvalStatus values', () => {

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
    describe('mixpanelContext', () => {
      let mixpanelSendPayloadSpy;

      beforeEach(() => {
        mixpanelSendPayloadSpy = sinon.spy(mixpanel, 'sendPayload');
      });

      afterEach(() => {
        mixpanelSendPayloadSpy.restore();
      });

      // Returns a promise
      it('includes the mixpanelContext param for reporting metrics', () => {
        const dispatch = () => {};
        const onSuccess = () => {};
        const parameters = {
          action: filterActions.TOGGLE_RECENTLY_VIEWED,
          pageNumber: 1,
          onlyRecentlyViewed: true,
          results: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        };

        return fetchResults(dispatch, getState, parameters, onSuccess).then((response) => {
          const mixpanelSendPayloadCall = mixpanel.sendPayload.getCall(0);

          assert.equal(mixpanelSendPayloadCall.args[0], 'Filtered Assets to Only Recently Viewed');
          assert.equal(Object.keys(mixpanelSendPayloadCall.args[1]).length, 3);
          assert(_.includes(Object.keys(mixpanelSendPayloadCall.args[1]), 'Result Count', 'pageNumber', 'onlyRecentlyViewed'));
          // Confirm that we don't send the entire collection of results to mixpanel
          assert(!_.includes(Object.keys(mixpanelSendPayloadCall.args[1]), 'results'));
          assert.equal(mixpanelSendPayloadCall.args[1].pageNumber, 1);
          assert(mixpanelSendPayloadCall.args[1].onlyRecentlyViewed);
        });
      });
    });
  });
});
