import { SHOW_MODAL, HIDE_MODAL } from 'actions/modal';

export const initialState = {
  visible: false,
  contentComponentName: null
};

const modal = (state = initialState, { type, contentComponentName }) => {
  switch (type) {
    case SHOW_MODAL:
      return {
        ...state,
        contentComponentName,
        visible: true
      };
    case HIDE_MODAL:
      return {
        ...state,
        visible: false
      };
    default:
      return state;
  }
};


export default modal;