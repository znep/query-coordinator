export const SHOW_MODAL = 'SHOW_MODAL';
export const showModal = (contentComponentName, payload = null) => ({
  type: SHOW_MODAL,
  contentComponentName,
  payload
});

export const HIDE_MODAL = 'HIDE_MODAL';
export const hideModal = () => ({
  type: HIDE_MODAL
});
