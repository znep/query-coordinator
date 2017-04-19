export const SHOW_MODAL = 'SHOW_MODAL';
export const showModal = (contentComponentName) => ({
  type: SHOW_MODAL,
  contentComponentName
});

export const HIDE_MODAL = 'HIDE_MODAL';
export const hideModal = () => ({
  type: HIDE_MODAL
});
