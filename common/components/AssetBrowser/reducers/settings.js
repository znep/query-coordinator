import _ from 'lodash';

const getInitialState = () => ({
  approvers: _.get(window, 'approvalsConfig.approvers')
});

export default (state = getInitialState(), action) => {
  if (action.type === 'TOGGLE_EMAIL_NOTIFICATION') {
    return {
      ...state
    };
  }

  if (action.type === 'CONFIGURE_AUTOMATIC_APPROVAL') {
    return {
      ...state
    };
  }

  return state;
};

