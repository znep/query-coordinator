import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { assert } from 'chai';
import sinon from 'sinon';
import { mockResponse } from 'httpHelpers';
import * as orderActions from 'actions/order';
import * as paginationActions from 'actions/pagination';

describe('order actions', () => {
  const responseData = [{'COLUMN_ALIAS_GUARD__count':'3'}];
  let fetchRowCountStub;

  beforeEach(() => {
    const response = _.constant(Promise.resolve(mockResponse(responseData, 200)));

    fetchRowCountStub = sinon.
      stub(window, 'fetch').
      callsFake(response);
  });

  afterEach(() => {
    fetchRowCountStub.restore();
  });

  it('.changeOrder', (done) => {
    const initialState = {
      filters: {
        activeTab: 'all'
      },
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 10
      }
    };

    const mockStore = configureStore([thunk]);
    const store = mockStore(initialState);

    store.
      dispatch(orderActions.changeOrder('date')).
      then(() => {
        const dispatchedActions = store.getActions();

        assert.isOk(dispatchedActions.
          find(act => act.type === orderActions.types.CHANGE_ORDER));
        assert.isOk(dispatchedActions.
          find(act => act.type === paginationActions.types.RESET_PAGE));
        assert.isOk(dispatchedActions.
          find(act => act.type === paginationActions.types.STORE_ROW_COUNT));

        done();
      });
  });

});
