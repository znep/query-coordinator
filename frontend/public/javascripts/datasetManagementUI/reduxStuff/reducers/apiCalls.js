import { API_CALL_STARTED, API_CALL_SUCCEEDED, API_CALL_FAILED } from 'reduxStuff/actions/apiCalls';
import { STATUS_CALL_IN_PROGRESS, STATUS_CALL_SUCCEEDED, STATUS_CALL_FAILED } from 'lib/apiCallStatus';

const initialState = {};

// used primarily to render spinners & error notifications
export default function apiCalls(state = initialState, action) {
  switch (action.type) {
    case API_CALL_STARTED: {
      return {
        ...state,
        [action.id]: {
          id: action.id,
          status: STATUS_CALL_IN_PROGRESS,
          operation: action.operation,
          params: action.params,
          startedAt: new Date()
        }
      };
    }
    case API_CALL_SUCCEEDED: {
      const call = state[action.id];
      return {
        ...state,
        [action.id]: {
          ...call,
          status: STATUS_CALL_SUCCEEDED,
          succeededAt: new Date()
        }
      };
    }
    case API_CALL_FAILED: {
      const call = state[action.id];
      return {
        ...state,
        [action.id]: {
          ...call,
          status: STATUS_CALL_FAILED,
          error: action.error,
          failedAt: new Date()
        }
      };
    }
    default:
      return state;
  }
}
