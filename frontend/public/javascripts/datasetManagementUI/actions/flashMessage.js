export const SHOW_FLASH_MESSAGE = 'SHOW_FLASH_MESSAGE';
export const showFlashMessage = (kind, message) => ({
  type: SHOW_FLASH_MESSAGE,
  kind,
  message
});

export const HIDE_FLASH_MESSAGE = 'HIDE_FLASH_MESSAGE';
export const hideFlashMessage = () => ({
  type: HIDE_FLASH_MESSAGE
});
