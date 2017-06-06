import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from 'actions/filters';
import mockCeteraResponse from 'data/mockCeteraResponse';
import ceteraUtils from 'common/ceteraUtils';

const stubFetch = (ceteraResponse = mockCeteraResponse) => (
  sinon.stub(ceteraUtils, 'fetch').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const mockStore = configureMockStore([ thunk ]);

let ceteraStub;

describe('actions/filters', () => {
  describe('toggleRecentlyViewed', () => {
    beforeEach(() => {
      ceteraStub = stubFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('toggles the recently viewed assets', () => {
      const initialState = { filters: { onlyRecentlyViewed: false } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: true },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'TOGGLE_RECENTLY_VIEWED' }
      ];

      return store.dispatch(Actions.toggleRecentlyViewed()).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('changeAssetType', () => {
    beforeEach(() => {
      ceteraStub = stubFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('changes the current asset type', () => {
      const initialState = { filters: { assetTypes: null } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_ASSET_TYPE', value: 'charts' }
      ];

      return store.dispatch(Actions.changeAssetType('charts')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('changeVisibility', () => {
    beforeEach(() => {
      ceteraStub = stubFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('changes the current visibility', () => {
      const initialState = { filters: { visibility: null } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_VISIBILITY', value: 'internal' }
      ];

      return store.dispatch(Actions.changeVisibility('internal')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });
});