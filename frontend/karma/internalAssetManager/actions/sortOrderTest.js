import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from 'actions/sortOrder';
import mockCeteraResponse from 'data/mockCeteraResponse';
import mockCeteraFacetCountsResponse from 'data/mock_cetera_facet_counts_response';
import ceteraUtils from 'common/cetera_utils';

const stubCeteraQuery = (ceteraResponse = mockCeteraResponse) => (
  sinon.stub(ceteraUtils, 'query').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const stubCeteraAssetCountsFetch = (ceteraResponse = mockCeteraFacetCountsResponse) => (
  sinon.stub(ceteraUtils, 'facetCountsQuery').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const mockStore = configureMockStore([ thunk ]);

let ceteraStub;
let ceteraAssetCountsStub;

describe('actions/sortOrder', () => {
  describe('changeSortOrder', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
      ceteraAssetCountsStub = stubCeteraAssetCountsFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
      ceteraAssetCountsStub.restore();
    });

    it('sets the order to the column name (ascending by default)', () => {
      const initialState = { catalog: { order: {} } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_SORT_ORDER', order: { value: 'name', ascending: true }  },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.changeSortOrder('name')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });

    it('sets the order to the column name (descending by default for lastUpdatedDate)', () => {
      const initialState = { catalog: { order: {} } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_SORT_ORDER', order: { value: 'lastUpdatedDate', ascending: false }  },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.changeSortOrder('lastUpdatedDate')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });

    it('sets the order to the provided column name (descending if it was previously ascending)', () => {
      const initialState = { catalog: { order: { value: 'name', ascending: true } } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_SORT_ORDER', order: { value: 'name', ascending: false }  },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.changeSortOrder('name')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });

    it('sets the order to the provided column name (ascending if I was ascending on a different column)', () => {
      const initialState = { catalog: { order: { value: 'name', ascending: true } } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_SORT_ORDER', order: { value: 'category', ascending: true }  },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.changeSortOrder('category')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });
});
