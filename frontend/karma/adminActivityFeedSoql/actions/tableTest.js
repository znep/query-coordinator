import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { assert } from 'chai';
import sinon from 'sinon';
import { mockResponse } from 'httpHelpers';
import * as tableActions from 'actions/table';
import * as mockData from '../data/mockFetchTable';

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
  const responseData = mockData.data1;
  let store;
  let fetchRowCountStub;

  beforeEach(() => {
    const response = _.constant(Promise.resolve(mockResponse(responseData, 200)));

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
        const action = store.
          getActions().
          find((act) => act.type === tableActions.types.STORE_DATA);

        assert.isNotNull(action);
        assert.deepEqual(action.data, mockData.data1);

        done();
      });
  });

});