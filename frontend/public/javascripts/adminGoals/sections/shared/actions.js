import * as downloads from './downloads/actions';
export { downloads };

import * as loading from './loading/actions';
export { loading };

import * as feedback from '../../components/feedback';

export const showFeedbackFlannel = hoverable => feedback.Flannel.actions.open(hoverable);

export const types = {
  showGlobalMessage: 'shared.showGlobalMessage',
  hideGlobalMessage: 'shared.hideGlobalMessage'
};

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
