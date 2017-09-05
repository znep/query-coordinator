import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from 'actions/filters';
import mockCeteraResponse from 'data/mock_cetera_response';
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

describe('actions/filters', () => {
  describe('clearAllFilters', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
      ceteraAssetCountsStub = stubCeteraAssetCountsFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
      ceteraAssetCountsStub.restore();
    });

    it('clears the filters', () => {
      const store = mockStore({ filters: { onlyRecentlyViewed: true } });

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CLEAR_ALL_FILTERS' },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.clearAllFilters()).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('toggleRecentlyViewed', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
      ceteraAssetCountsStub = stubCeteraAssetCountsFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
      ceteraAssetCountsStub.restore();
    });

    it('toggles the recently viewed assets', () => {
      const store = mockStore({ filters: { onlyRecentlyViewed: false, sortByRecentlyViewed: false } });

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: true, sortByRecentlyViewed: true },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'TOGGLE_RECENTLY_VIEWED' },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.toggleRecentlyViewed()).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('changeAssetType', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
      ceteraAssetCountsStub = stubCeteraAssetCountsFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
      ceteraAssetCountsStub.restore();
    });

    it('changes the current asset type', () => {
      const store = mockStore({ filters: { assetTypes: null } });

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_ASSET_TYPE', value: 'charts' },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.changeAssetType('charts')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('changeVisibility', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
      ceteraAssetCountsStub = stubCeteraAssetCountsFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
      ceteraAssetCountsStub.restore();
    });

    it('changes the current visibility', () => {
      const store = mockStore({ filters: { visibility: null } });

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_VISIBILITY', value: 'internal' },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.changeVisibility('internal')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('changeQ', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
      ceteraAssetCountsStub = stubCeteraAssetCountsFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
      ceteraAssetCountsStub.restore();
    });

    it('changes the current query and clears the existing sort', () => {
      const store = mockStore({
        filters: { q: null },
        catalog: { order: { ascending: false, value: 'name' } }
      });

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_Q', value: 'transformers! robots in disguise' },
        { type: 'CHANGE_SORT_ORDER', order: undefined },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.changeQ('transformers! robots in disguise')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('changeCustomFacet', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
      ceteraAssetCountsStub = stubCeteraAssetCountsFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
      ceteraAssetCountsStub.restore();
    });

    it('changes a given custom facet', () => {
      const store = mockStore({ filters: { customFacets: { City_Neighborhood: 'Greenlake' } } });

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_CUSTOM_FACET', facetParam: 'City_Neighborhood', value: 'Capitol Hill' },
        { type: 'CHANGE_PAGE', pageNumber: 1 },
        { type: 'FETCH_ASSET_COUNTS' },
        { type: 'FETCH_ASSET_COUNTS_SUCCESS' },
        { type: 'UPDATE_ASSET_COUNTS', assetCounts: mockCeteraFacetCountsResponse[0].values }
      ];

      return store.dispatch(Actions.changeCustomFacet('City_Neighborhood', 'Capitol Hill')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });
});
