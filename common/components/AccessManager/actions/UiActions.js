// Save button was clicked
export const SAVE_BUTTON_CLICKED = 'SAVE_BUTTON_CLICKED';
export const saveButtonClicked = () => ({ type: SAVE_BUTTON_CLICKED });

// The cancel button was clicked (close the modal)
export const CANCEL_BUTTON_CLICKED = 'CANCEL_BUTTON_CLICKED';
export const cancelButtonClicked = () => ({ type: CANCEL_BUTTON_CLICKED });

// A function gets added to window that basically dispatches this action when called
export const SHOW_ACCESS_MANAGER = 'SHOW_ACCESS_MANAGER';
export const showAccessManager = (refreshPageOnSave, mode) => ({
  type: SHOW_ACCESS_MANAGER,
  refreshPageOnSave,
  mode
});

export const SET_CONFIRM_BUTTON_DISABLED = 'SET_CONFIRM_BUTTON_DISABLED';
export const setConfirmButtonDisabled = disabled => ({ type: SET_CONFIRM_BUTTON_DISABLED, disabled });

export const DISMISS_TOAST_MESSAGE = 'DISMISS_TOAST_MESSAGE';
export const dismissToastMessage = () => ({ type: DISMISS_TOAST_MESSAGE });

export const REDIRECT_TO = 'REDIRECT_TO';
export const redirectTo = (url) => ({ type: REDIRECT_TO, url });
