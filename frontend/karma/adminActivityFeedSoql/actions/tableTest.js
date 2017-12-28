import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { assert } from 'chai';
import sinon from 'sinon';
import { mockResponse } from 'httpHelpers';
import * as tableActions from 'actions/table';
import mockData from '../data/mockFetchTable';

const initialState = {
  pagination: {
    pageSize: 10,
    offset: 0,
    page: 1
  },
  filters: {
    activeTab: 'all'
  }
};

const mockStore = configureStore([
  thunk
]);

describe('table actions', () => {
  let store;
  let fetchRowCountStub;

  beforeEach(() => {
    const response = _.constant(Promise.resolve(mockResponse(mockData, 200)));

    fetchRowCountStub = sinon.
      stub(window, 'fetch').
      callsFake(response);

    store = mockStore(initialState);
  });

  afterEach(() => {
    fetchRowCountStub.restore();
  });

  it('should fetchData', (done) => {
    store.
      dispatch(tableActions.fetchData()).
      then(() => {
        const actions = store.getActions();

        const storeDataAction = actions.find((act) => act.type === tableActions.types.STORE_DATA);
        assert.isNotNull(storeDataAction);
        assert.deepEqual(storeDataAction.data, mockData);

        const fetchingTableAction = actions.find((act) => act.type === tableActions.types.FETCHING_TABLE);
        assert.isNotNull(fetchingTableAction);

        const fetchTableSuccessAction = actions.find((act) => act.type === tableActions.types.FETCH_TABLE_SUCCESS);
        assert.isNotNull(fetchTableSuccessAction);

        done();
      });
  });

});
