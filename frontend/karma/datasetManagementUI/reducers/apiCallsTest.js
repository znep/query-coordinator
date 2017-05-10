import { assert } from 'chai';
import apiCallsReducer from 'reducers/apiCalls';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed
} from 'actions/apiCalls';

describe('reducers/database', () => {

  const call = {
    operation: 'LOAD_ROWS',
    params: {
      outputSchemaId: 2,
      pageNo: 1
    }
  };

  it('handles API_CALL_STARTED', () => {
    const initialState = apiCallsReducer(undefined, {});
    assert.deepEqual(apiCallsReducer(initialState, apiCallStarted(0, call)), {
      0: {
        id: 0,
        operation: call.operation,
        params: call.params,
        status: 'STATUS_CALL_IN_PROGRESS'
      }
    })
  });

  it('handles API_CALL_SUCCEEDED', () => {
    const initialState = {
      0: {
        id: 0,
        operation: call.operation,
        params: call.params,
        status: 'STATUS_CALL_IN_PROGRESS'
      }
    };
    assert.deepEqual(apiCallsReducer(initialState, apiCallSucceeded(0)), {
      0: {
        id: 0,
        operation: call.operation,
        params: call.params,
        status: 'STATUS_CALL_SUCCEEDED'
      }
    })
  });

  it('handles API_CALL_FAILED', () => {
    const initialState = {
      0: {
        id: 0,
        operation: call.operation,
        params: call.params,
        status: 'STATUS_CALL_IN_PROGRESS'
      }
    };
    assert.deepEqual(apiCallsReducer(initialState, apiCallFailed(0, 'some-error')), {
      0: {
        id: 0,
        operation: call.operation,
        params: call.params,
        status: 'STATUS_CALL_FAILED',
        error: 'some-error'
      }
    })
  });

});
