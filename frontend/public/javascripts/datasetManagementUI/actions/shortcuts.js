import { showModal } from './modal';

const shortcuts = ['geocode'];

function needToShowAnything(displayState, state) {
  const modalName = displayState.shortcutName;
  const modalShowing = state.ui.modal.contentComponentName === modalName && state.ui.modal.visible;
  return !modalShowing && (shortcuts.indexOf(modalName) >= 0);
}

export function showShortcut(displayState, path) {
  return (dispatch, getState) => {
    if (needToShowAnything(displayState, getState())) {
      dispatch(showModal(displayState.shortcutName, path));
    }
  };
}
