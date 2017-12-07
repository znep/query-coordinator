// Change the header at the top of the modal
export const CHANGE_HEADER = 'CHANGE_HEADER';
export const changeHeader = (title, subtitle) => ({
  type: CHANGE_HEADER,
  title,
  subtitle
});

// Save button was clicked
export const SAVE_BUTTON_CLICKED = 'SAVE_BUTTON_CLICKED';
export const saveButtonClicked = () => ({ type: SAVE_BUTTON_CLICKED });

// The cancel button was clicked (close the modal)
export const CANCEL_BUTTON_CLICKED = 'CANCEL_BUTTON_CLICKED';
export const cancelButtonClicked = () => ({ type: CANCEL_BUTTON_CLICKED });

// A function gets added to window that basically dispatches this action when called
export const SHOW_ACCESS_MANAGER = 'SHOW_ACCESS_MANAGER';
export const showAccessManager = () => ({ type: SHOW_ACCESS_MANAGER });
