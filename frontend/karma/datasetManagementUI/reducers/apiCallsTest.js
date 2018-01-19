import { assert } from 'chai';
import apiCallsReducer from 'datasetManagementUI/reduxStuff/reducers/apiCalls';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed
} from 'datasetManagementUI/reduxStuff/actions/apiCalls';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

const mockStore = configureStore([thunk]);

describe('apiCalls reducer', () => {

  const call = {
    operation: 'LOAD_ROWS',
    callParams: {
      outputSchemaId: 2,
      pageNo: 1
    }
  };

  it('handles API_CALL_STARTED', () => {
    const initialState = apiCallsReducer(undefined, {});
    const result = apiCallsReducer(initialState, apiCallStarted(0, call));
    assert.ok(result[0].startedAt);
    delete result[0].startedAt;
    assert.deepEqual(result, {
      0: {
        id: 0,
        operation: call.operation,
        callParams: call.callParams,
        status: 'STATUS_CALL_IN_PROGRESS'
      }
    })
  });

  it('handles API_CALL_SUCCEEDED', () => {
    const initialState = {
      0: {
        id: 0,
        operation: call.operation,
        callParams: call.callParams,
        status: 'STATUS_CALL_IN_PROGRESS'
      }
    };
    const result = apiCallsReducer(initialState, apiCallSucceeded(0));
    assert.ok(result[0].succeededAt);
    delete result[0].succeededAt;
    assert.deepEqual(result, {
      0: {
        id: 0,
        operation: call.operation,
        callParams: call.callParams,
        status: 'STATUS_CALL_SUCCEEDED'
      }
    })
  });

  it('handles API_CALL_FAILED', done => {
    const initialState = {
      0: {
        id: 0,
        operation: call.operation,
        callParams: call.callParams,
        status: 'STATUS_CALL_IN_PROGRESS',
        succeededAt: null,
        failedAt: null
      }
    };
    const store = mockStore({});
    store.dispatch(apiCallFailed(0, "some-error"))
    setTimeout(() => {
      const action = store.getActions()[0];
      assert.deepEqual(action, {type: 'API_CALL_FAILED', id: 0, error: 'some-error'});

      const result = apiCallsReducer(initialState, action);
      assert.ok(result[0].failedAt);
      delete result[0].failedAt;
      assert.deepEqual(result[0].status, 'STATUS_CALL_FAILED');
      done();
    }, 20);
  });
});
