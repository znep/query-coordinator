import _ from 'lodash';

const getInitialState = () => ({
  performingAction: false,
  performingActionSuccess: false,
  performingActionFailure: false
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'CLOSE_MODAL') {
    return {
      ...state,
      performingAction: false,
      performingActionSuccess: false,
      performingActionFailure: false
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

  return state;
};
