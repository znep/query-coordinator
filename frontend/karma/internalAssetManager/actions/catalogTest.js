import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from 'actions/catalog';
import mockCeteraResponse from 'data/mockCeteraResponse';
import ceteraUtils from 'common/ceteraUtils';

const stubFetch = (ceteraResponse = mockCeteraResponse) => (
  sinon.stub(ceteraUtils, 'fetch').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const mockStore = configureMockStore([ thunk ]);

let ceteraStub;

describe('actions/catalog', () => {
  describe('changeOrder', () => {
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
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_ORDER', order: { value: 'name', ascending: true }  }
      ];

      return store.dispatch(Actions.changeOrder('name')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });

    it('sets the order to the provided column name (descending if it was previously ascending)', () => {
      const initialState = { catalog: { order: { value: 'name', ascending: true } } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_ORDER', order: { value: 'name', ascending: false }  }
      ];

      return store.dispatch(Actions.changeOrder('name')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });

    it('sets the order to the provided column name (ascending if I was ascending on a different column)', () => {
      const initialState = { catalog: { order: { value: 'name', ascending: true } } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_ORDER', order: { value: 'lastUpdatedDate', ascending: true }  }
      ];

      return store.dispatch(Actions.changeOrder('lastUpdatedDate')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('changePage', () => {
    beforeEach(() => {
      ceteraStub = stubFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('sets the currentPage', () => {
      const initialState = { catalog: { currentPage: 1 } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_PAGE', pageNumber: 4  }
      ];

      return store.dispatch(Actions.changePage(4)).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });
});
