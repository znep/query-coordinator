import * as downloads from './downloads/actions';
export { downloads };

import * as feedback from '../../components/feedback';

export const showFeedbackFlannel = hoverable => feedback.Flannel.actions.open(hoverable);

export const types = {
  startLoading: 'shared.startLoading',
  stopLoading: 'shared.stopLoading',
  showLoadingError: 'shared.showLoadingError',
  showModalMessage: 'shared.showModalMessage',
  hideModalMessage: 'shared.hideModalMessage',
  showGlobalMessage: 'shared.showGlobalMessage',
  hideGlobalMessage: 'shared.hideGlobalMessage',
  setModalInProgress: 'shared.setModalInProgress'
};

export const startLoading = () => ({
  type: types.startLoading
});

export const stopLoading = () => ({
  type: types.stopLoading
});

export const showLoadingError = message => ({
  type: types.showLoadingError,
  message
});

export const showModalMessage = (section, modalName, message, messageType = 'error') => ({
  type: types.showModalMessage,
  section,
  modalName,
  message,
  messageType
});

export const hideModalMessage = (section) => ({
  type: types.hideModalMessage,
  section
});

export const setModalInProgress = (section, modalName, inProgress) => ({
  type: types.setModalInProgress,
  section,
  modalName,
  inProgress
});

export const showGlobalMessage = (section, message, messageType = 'error') => ({
  type: types.showGlobalMessage,
  section,
  notification: {
    message,
    type: messageType
  }
});

export const hideGlobalMessage = (section) => ({
  type: types.hideGlobalMessage,
  section
});

export const createHandler = (section, handler) => (state, action) => {
  if (action.section !== section) {
    return state;
  }

  return handler(state, action);
};

export const createModalHandler = (section, modalName, handler) => (state, action) => {
  if (action.section !== section || action.modalName !== modalName) {
    return state;
  }

  return handler(state, action);
};
