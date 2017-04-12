import {
  NEXT_HELP_ITEM,
  PREVIOUS_HELP_ITEM,
  OPEN_HELP_MODAL,
  CLOSE_HELP_MODAL
} from 'actions/readyToImport';

export const initialState = {
  modalVisible: false,
  modalIndex: 0
};

const itemCount = 3;


const readyToImport = (state = initialState, { type }) => {
  switch (type) {
    case NEXT_HELP_ITEM:
      return {
        ...state,
        modalIndex: (state.modalIndex + 1) % itemCount,
        modalVisible: (state.modalIndex + 1) < itemCount
      };
    case PREVIOUS_HELP_ITEM:
      return {
        ...state,
        modalIndex: Math.max(state.modalIndex - 1, 0)
      };
    case OPEN_HELP_MODAL:
      return {
        ...initialState,
        modalVisible: true
      };
    case CLOSE_HELP_MODAL:
      return initialState;
    default:
      return state;
  }
};

export default readyToImport;
