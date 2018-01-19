import { SHOW_MODAL, HIDE_MODAL } from 'datasetManagementUI/reduxStuff/actions/modal';

export const initialState = {
  visible: false,
  contentComponentName: null,
  payload: null
};

const modal = (state = initialState, action) => {
  switch (action.type) {
    case SHOW_MODAL:
      return {
        visible: true,
        contentComponentName: action.contentComponentName,
        payload: action.payload
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
