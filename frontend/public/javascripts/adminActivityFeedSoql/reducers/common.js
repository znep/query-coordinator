import * as actions from '../actions';

const initialState = {
  filtersOpen: false,
  numberOfDaysRestorable: 14,
  restoreModal: null,
  apiError: null,
  apiCallInProgress: false,
  successMessage: null
};

export default function table(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  switch (action.type) {
    case actions.common.types.TOGGLE_FILTERS:
      return Object.assign({}, state, { filtersOpen: !state.filtersOpen });

    case actions.common.types.STORE_NUMBER_OF_DAYS_RESTORABLE:
      return Object.assign({}, state, { numberOfDaysRestorable: action.numberOfDaysRestorable });

    case actions.common.types.SHOW_RESTORE_MODAL:
      return Object.assign({}, state, { restoreModal: action.uid });

    case actions.common.types.HIDE_RESTORE_MODAL:
      return Object.assign({}, state, { restoreModal: null });

    case actions.common.types.API_CALL_IN_PROGRESS:
      return Object.assign({}, state, { apiCallInProgress: true });

    case actions.common.types.API_CALL_SUCCESS:
      return Object.assign({}, state, { apiCallInProgress: false });

    case actions.common.types.API_ERROR:
      return Object.assign({}, state, {
        apiCallInProgress: false,
        apiError: action.details || true
      });

    case actions.common.types.SHOW_SUCCESS_MESSAGE:
      return Object.assign({}, state, { successMessage: action.message });

    case actions.common.types.HIDE_SUCCESS_MESSAGE:
      return Object.assign({}, state, { successMessage: null });

    default:
      return state;
  }
}
