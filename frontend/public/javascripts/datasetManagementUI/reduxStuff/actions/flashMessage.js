import _ from 'lodash';

export const HIDE_FLASH_MESSAGE = 'HIDE_FLASH_MESSAGE';
export const hideFlashMessage = () => ({
  type: HIDE_FLASH_MESSAGE
});

export const SHOW_FLASH_MESSAGE = 'SHOW_FLASH_MESSAGE';
export const showFlashMessage = (kind, message, hideAfterMS) => dispatch => {
  dispatch({
    type: SHOW_FLASH_MESSAGE,
    kind,
    message
  });

  if (hideAfterMS && _.isNumber(hideAfterMS)) {
    setTimeout(() => {
      dispatch(hideFlashMessage());
    }, hideAfterMS);
  }
};
