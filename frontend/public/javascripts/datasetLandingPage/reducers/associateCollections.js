// EN-19924: USAID sadtimes
// Lift 'n shift from DSMUI `apiCalls`

const initialState = [];

// used primarily to render spinners & error notifications
export default function apiCalls(state = initialState, action) {
  switch (action.type) {
    case 'API_CALL_STARTED': {
      return [
        ...state,
        { status: 'STATUS_CALL_IN_PROGRESS' }
      ];
    }
    case 'API_CALL_SUCCEEDED': {
      return [
        ...state,
        {
          status: 'STATUS_CALL_SUCCEEDED',
          succeededAt: new Date()
        }
      ];
    }
    case 'API_CALL_FAILED': {
      return [
        ...state,
        { status: 'STATUS_CALL_FAILED' }
      ];
    }
    default:
      return state;
  }
}
