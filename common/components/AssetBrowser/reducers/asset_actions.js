import _ from 'lodash';

const getInitialState = () => ({
  activeActionModalType: null,
  activeActionForUid: null,
  alert: {},
  performingAction: false,
  performingActionSuccess: false,
  performingActionFailure: false
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'SHOW_MODAL') {
    return {
      ...state,
      activeActionModalType: action.modalType,
      activeActionForUid: action.uid
    };
  }

  if (action.type === 'CLOSE_MODAL') {
    return {
      ...state,
      activeActionModalType: null,
      activeActionForUid: null
    };
  }

  if (action.type === 'PERFORMING_ACTION') {
    return {
      ...state,
      performingAction: true,
      performingActionSuccess: false,
      performingActionFailure: false
    };
  }

  if (action.type === 'PERFORMING_ACTION_SUCCESS') {
    return {
      ...state,
      performingAction: false,
      performingActionSuccess: true,
      performingActionFailure: false
    };
  }

  if (action.type === 'PERFORMING_ACTION_FAILURE') {
    return {
      ...state,
      performingAction: false,
      performingActionSuccess: false,
      performingActionFailure: true,
      actionResponse: action.response
    };
  }

  if (action.type === 'SHOW_ALERT') {
    return {
      ...state,
      alert: {
        title: action.title,
        body: action.body,
        time: action.time
      }
    };
  }

  if (action.type === 'HIDE_ALERT') {
    return {
      ...state,
      alert: {}
    };
  }

  return state;
};
