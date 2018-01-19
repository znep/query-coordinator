import { SHOW_FLASH_MESSAGE, HIDE_FLASH_MESSAGE } from 'datasetManagementUI/reduxStuff/actions/flashMessage';

export const initialState = {
  message: '',
  kind: '',
  visible: false
};

const flashMessage = (state = initialState, { type, message, kind }) => {
  switch (type) {
    case SHOW_FLASH_MESSAGE:
      return {
        ...state,
        message,
        kind,
        visible: true
      };
    case HIDE_FLASH_MESSAGE:
      return {
        ...state,
        visible: false
      };
    default:
      return state;
  }
};

export default flashMessage;
