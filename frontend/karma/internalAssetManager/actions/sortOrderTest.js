import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from 'actions/sortOrder';
import mockCeteraResponse from 'data/mockCeteraResponse';
import ceteraUtils from 'common/ceteraUtils';

const stubFetch = (ceteraResponse = mockCeteraResponse) => (
  sinon.stub(ceteraUtils, 'fetch').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const mockStore = configureMockStore([ thunk ]);

let ceteraStub;

describe('actions/sortOrder', () => {
  describe('changeSortOrder', () => {
    beforeEach(() => {
      ceteraStub = stubFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('sets the order to the column name (ascending by default)', () => {
      const initialState = { catalog: { order: {} } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_SORT_ORDER', order: { value: 'name', ascending: true }  }
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
        { type: 'CHANGE_SORT_ORDER', order: { value: 'lastUpdatedDate', ascending: false }  }
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
        { type: 'CHANGE_SORT_ORDER', order: { value: 'name', ascending: false }  }
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
        { type: 'CHANGE_SORT_ORDER', order: { value: 'category', ascending: true }  }
      ];

      return store.dispatch(Actions.changeSortOrder('category')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });
});
