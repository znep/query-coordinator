import { assert } from 'chai';
import apiCallsReducer from 'reduxStuff/reducers/apiCalls';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed
} from 'reduxStuff/actions/apiCalls';

describe('apiCalls reducer', () => {

  const call = {
    operation: 'LOAD_ROWS',
    params: {
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
    const result = apiCallsReducer(initialState, apiCallSucceeded(0));
    assert.ok(result[0].succeededAt);
    delete result[0].succeededAt;
    assert.deepEqual(result, {
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
    const result = apiCallsReducer(initialState, apiCallFailed(0, 'some-error'));
    assert.ok(result[0].failedAt);
    delete result[0].failedAt;
    assert.deepEqual(result, {
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
