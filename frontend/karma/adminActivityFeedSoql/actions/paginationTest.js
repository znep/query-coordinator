import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { assert } from 'chai';
import sinon from 'sinon';
import { mockResponse } from 'httpHelpers';
import * as paginationActions from 'actions/pagination';

const initialState = {
  filters: {
    activeTab: 'all'
  }
};

const mockStore = configureStore([
  thunk
]);

describe('pagination actions', () => {
  const responseData = [{'COLUMN_ALIAS_GUARD__count':'3'}];
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

  it('should fetchRowCount', (done) => {
    store.
      dispatch(paginationActions.fetchRowCount()).
      then(() => {
        const action = store.
          getActions().
          find((act) => act.type === paginationActions.types.STORE_ROW_COUNT);

        assert.isNotNull(action);
        assert.equal(action.rowCount, responseData[0]['COLUMN_ALIAS_GUARD__count']);
        done();
      });
  });

});
