import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import ceteraUtils from 'common/cetera/utils';

import * as constants from 'common/components/AssetBrowser/lib/constants.js';
import * as filterActions from 'common/components/AssetBrowser/actions/filters';
import * as ceteraActions from 'common/components/AssetBrowser/actions/cetera';
import * as pagerActions from 'common/components/AssetBrowser/actions/pager';
import * as sortActions from 'common/components/AssetBrowser/actions/sort_order';

import mockCeteraResponse from '../data/mock_cetera_response';

const stubCeteraQuery = (ceteraResponse = mockCeteraResponse) => (
  sinon.stub(ceteraUtils, 'query').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const mockStore = configureMockStore([thunk]);

let ceteraStub;
let customMockCeteraResponse;

// Individually compare actions to make debugging tolerable.
const verifyActions = (expectedActions, actualActions) => {
  assert.deepEqual(
    _.map(expectedActions, 'type'),
    _.map(actualActions, 'type'),
    'Action types do not match'
  );
  _.zip(expectedActions, actualActions).forEach(([expected, actual]) => {
    assert.deepEqual(expected, actual);
  });
};

describe('actions/filters', () => {
  beforeEach(() => window.socrata = { initialState: { catalog: {} } });

  afterEach(() => delete window.socrata);

  describe('clearAllFilters', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('clears the filters', () => {
      const baseFilters = { baseFiltersMock: true };
      const store = mockStore({
        activeTab: constants.MY_QUEUE_TAB,
        filters: { onlyRecentlyViewed: true },
        tabs: { [constants.MY_QUEUE_TAB]: { props: { baseFilters } } }
      });

      // Please note: this giant list of actions resulting from a single
      // operations is an anti-pattern. Don't take it as a good example.
      // This spec is not great as a result.
      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        {
          type: ceteraActions.UPDATE_CATALOG_RESULTS,
          response: mockCeteraResponse,
          onlyRecentlyViewed: false,
          sortByRecentlyViewed: false
        },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: filterActions.CLEAR_ALL_FILTERS },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 1 }
      ];

      return store.dispatch(filterActions.clearAllFilters()).then(() => {
        verifyActions(expectedActions, store.getActions());
      });
    });
  });

  describe('toggleRecentlyViewed', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('toggles the recently viewed assets', () => {
      const store = mockStore({ filters: { onlyRecentlyViewed: false, sortByRecentlyViewed: false } });

      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        { type: ceteraActions.UPDATE_CATALOG_RESULTS, response: mockCeteraResponse, onlyRecentlyViewed: true, sortByRecentlyViewed: true },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: filterActions.TOGGLE_RECENTLY_VIEWED },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 1 }
      ];

      return store.dispatch(filterActions.toggleRecentlyViewed()).then(() => {
        verifyActions(expectedActions, store.getActions());
      });
    });
  });

  describe('changeAssetType', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('changes the current asset type', () => {
      const store = mockStore({ filters: { assetTypes: null } });

      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        { type: ceteraActions.UPDATE_CATALOG_RESULTS, response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: filterActions.CHANGE_ASSET_TYPE, value: 'charts' },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 1 }
      ];

      return store.dispatch(filterActions.changeAssetType('charts')).then(() => {
        verifyActions(expectedActions, store.getActions());
      });
    });
  });

  describe('changeVisibility', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('changes the current visibility', () => {
      const store = mockStore({ filters: { visibility: null } });

      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        { type: ceteraActions.UPDATE_CATALOG_RESULTS, response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: filterActions.CHANGE_VISIBILITY, value: 'internal' },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 1 }
      ];

      return store.dispatch(filterActions.changeVisibility('internal')).then(() => {
        verifyActions(expectedActions, store.getActions());
      });
    });
  });

  describe('changeQ', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('changes the current query and clears the existing sort', () => {
      const store = mockStore({
        filters: { q: null },
        catalog: { order: { ascending: false, value: 'name' } }
      });

      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        { type: ceteraActions.UPDATE_CATALOG_RESULTS, response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: filterActions.CHANGE_Q, value: 'transformers! robots in disguise' },
        { type: sortActions.CHANGE_SORT_ORDER, order: undefined },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 1 }
      ];

      return store.dispatch(filterActions.changeQ('transformers! robots in disguise')).then(() => {
        verifyActions(expectedActions, store.getActions());
      });
    });
  });

  describe('changeQ with a 4x4 that maps to a view', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('searches by 4x4 and clears the existing sort', () => {
      const store = mockStore({
        filters: { q: null },
        catalog: { order: { ascending: false, value: 'name' } }
      });

      // TODO: I have no idea what's going on here with the repeating actions :/
      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        { type: ceteraActions.UPDATE_CATALOG_RESULTS, response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: sortActions.CHANGE_SORT_ORDER, order: undefined },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 1 }
      ];

      return store.dispatch(filterActions.changeQ('asdf-1234')).then(() => {
        verifyActions(expectedActions, store.getActions());
      });
    });
  });

  describe('changeQ with a 4x4 that does not map to a view', () => {
    beforeEach(() => {
      customMockCeteraResponse = _.assign({}, mockCeteraResponse,
        { results: [], resultSetSize: 0 });
      ceteraStub = sinon.stub(ceteraUtils, 'query')
        .onFirstCall().callsFake(_.constant(Promise.resolve(customMockCeteraResponse)))
        .onSecondCall().callsFake(_.constant(Promise.resolve(mockCeteraResponse)));
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('searches by 4x4 and clears the existing sort', () => {
      const store = mockStore({
        filters: { q: null },
        catalog: { order: { ascending: false, value: 'name' } }
      });

      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        { type: ceteraActions.UPDATE_CATALOG_RESULTS, response: customMockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: ceteraActions.FETCH_RESULTS },
        { type: ceteraActions.UPDATE_CATALOG_RESULTS, response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: filterActions.CHANGE_Q, value: 'asdf-1234' },
        { type: sortActions.CHANGE_SORT_ORDER, order: undefined },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 1 }
      ];

      return store.dispatch(filterActions.changeQ('asdf-1234')).then(() => {
        verifyActions(expectedActions, store.getActions());
      });
    });
  });

  describe('changeCustomFacet', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('changes a given custom facet', () => {
      const store = mockStore({ filters: { customFacets: { City_Neighborhood: 'Greenlake' } } });

      const expectedActions = [
        { type: ceteraActions.FETCH_RESULTS },
        { type: ceteraActions.UPDATE_CATALOG_RESULTS, response: mockCeteraResponse, onlyRecentlyViewed: false, sortByRecentlyViewed: false },
        { type: ceteraActions.FETCH_RESULTS_SUCCESS },
        { type: filterActions.CHANGE_CUSTOM_FACET, facetParam: 'City_Neighborhood', value: 'Capitol Hill' },
        { type: pagerActions.CHANGE_PAGE, pageNumber: 1 }
      ];

      return store.dispatch(filterActions.changeCustomFacet('City_Neighborhood', 'Capitol Hill')).then(() => {
        verifyActions(expectedActions, store.getActions());
      });
    });
  });
});
