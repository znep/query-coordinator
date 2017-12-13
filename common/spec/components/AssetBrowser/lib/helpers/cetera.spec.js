import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import mixpanel from 'common/mixpanel';

import catalogState from 'common/components/AssetBrowser/reducers/catalog';
import ceteraUtils from 'common/cetera/utils';
import * as ceteraHelpers from 'common/components/AssetBrowser/lib/helpers/cetera.js';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import * as filterActions from 'common/components/AssetBrowser/actions/filters';

import mockCeteraFacetCountsResponse from '../../data/mock_cetera_facet_counts_response';
import mockCeteraFetchResponse from '../../data/mock_cetera_fetch_response';
import initialState from '../../../../data/mock_initial_state';

describe('helpers/cetera', () => {
  let ceteraStub;
  let ceteraAssetCountsStub;

  beforeEach(() => {
    window.socrata = { initialState };
    ceteraStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(mockCeteraFetchResponse)));
    ceteraAssetCountsStub = sinon.stub(ceteraUtils, 'facetCountsQuery').
      callsFake(_.constant(Promise.resolve(mockCeteraFacetCountsResponse)));
  });

  afterEach(() => {
    delete window.socrata;
    ceteraStub.restore();
    ceteraAssetCountsStub.restore();
  });

  describe('mergedCeteraQueryParameters', () => {
    describe('baseFilters', () => {
      it('overrides normal filters', () => {
        const state = () => ({
          header: {
            activeTab: constants.ALL_ASSETS_TAB
          },
          assetBrowserProps: {
            tabs: {
              [constants.ALL_ASSETS_TAB]: {
                props: {
                  baseFilters: {
                    assetTypes: 'charts',
                    forUser: 'abcd-1234'
                  }
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

        const result = ceteraHelpers.mergedCeteraQueryParameters(state, parameters);
        assert.equal(result.only, 'charts');
        assert.equal(result.forUser, 'abcd-1234');
        assert.equal(result.q, 'foo');
      });

      it('handles an array of approvalStatus values', () => {

      });
    });

    it('adds custom facet filters', () => {
      const parameters = { customFacets: { Foo_Bar: 'abcd' } };
      const result = ceteraHelpers.mergedCeteraQueryParameters(catalogState, parameters);
      assert.deepEqual(result.customMetadataFilters, { Foo_Bar: 'abcd' });
    });

    it('overrides an existing custom facet filter', () => {
      const state = () => ({ filters: { customFacets: { Foo_Bar: 'some existing value' } } });
      const parameters = { customFacets: { Foo_Bar: null } };
      const result = ceteraHelpers.mergedCeteraQueryParameters(state, parameters);
      assert.deepEqual(result.customMetadataFilters, { Foo_Bar: null });
    });

    it('can have multiple custom facet filters', () => {
      const state = () => ({ filters: { customFacets: { Foo_Bar: 'some existing value' } } });
      const parameters = { customFacets: { Foo_Bar2: 'another value' } };
      const result = ceteraHelpers.mergedCeteraQueryParameters(state, parameters);
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

        return ceteraHelpers.fetchResults(dispatch, catalogState, parameters, onSuccess).then((response) => {
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

    describe('fetchAssetCounts', () => {
      it('is called from fetchResults when showAssetCounts is true', () => {
        const dispatch = () => {};
        const state = () => ({
          assetBrowserProps: {
            showAssetCounts: true
          }
        });

        ceteraHelpers.fetchResults(dispatch, state).then((response) => {
          sinon.assert.calledOnce(ceteraAssetCountsStub);
        });
      });

      it('is not called from fetchResults when showAssetCounts is false', () => {
        const dispatch = () => {};
        const state = () => ({
          assetBrowserProps: {
            showAssetCounts: false
          }
        });

        ceteraHelpers.fetchResults(dispatch, state).then((response) => {
          sinon.assert.notCalled(ceteraAssetCountsStub);
        });
      });
    });
  });
});
