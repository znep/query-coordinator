import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import ceteraUtils from 'common/cetera/utils';
import * as pagerActions from 'common/components/AssetBrowser/actions/pager';
import * as ceteraActions from 'common/components/AssetBrowser/actions/cetera';

import mockCeteraResponse from '../data/mock_cetera_response';
import mockCeteraFacetCountsResponse from '../data/mock_cetera_facet_counts_response';

const stubCeteraQuery = (ceteraResponse = mockCeteraResponse) => (
  sinon.stub(ceteraUtils, 'query').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const stubCeteraAssetCountsFetch = (ceteraResponse = mockCeteraFacetCountsResponse) => (
  sinon.stub(ceteraUtils, 'facetCountsQuery').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const mockStore = configureMockStore([thunk]);

let ceteraStub;
let ceteraAssetCountsStub;

describe('actions/pager', () => {
  describe('changePage', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
      ceteraAssetCountsStub = stubCeteraAssetCountsFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
      ceteraAssetCountsStub.restore();
    });

    it('sets the pageNumber', () => {
      const initialState = { catalog: { pageNumber: 1 } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        {
          type: ceteraActions.UPDATE_CATALOG_RESULTS,
          response: mockCeteraResponse,
          onlyRecentlyViewed: false,
          sortByRecentlyViewed: false
        },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 4 },
        { type: ceteraActions.FETCH_ASSET_COUNTS },
        { type: ceteraActions.FETCH_ASSET_COUNTS_SUCCESS },
        { type: ceteraActions.UPDATE_ASSET_COUNTS, assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(pagerActions.changePage(4)).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });
});
