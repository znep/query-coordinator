import { OPEN_DATA_MODAL, CLOSE_DATA_MODAL } from '../actions/manageData';

export function getInitialState() {
  return {
    modalOpen: false
  };
}

export default function(state = getInitialState(), action) {
  switch (action.type) {
    case OPEN_DATA_MODAL:
      return {
        ...state,
        modalOpen: true
      };
    case CLOSE_DATA_MODAL:
      return {
        ...state,
        modalOpen: false
      };
    default:
      return state;
  }
}
