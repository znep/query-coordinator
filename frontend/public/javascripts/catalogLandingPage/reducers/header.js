import _ from 'lodash';

const getInitialState = () => _.get(window, 'initialState.header', {});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'UPDATE_HEADLINE') {
    return {
      ...state,
      headline: action.text
    };
  } else if (action.type === 'UPDATE_DESCRIPTION') {
    return {
      ...state,
      description: action.text
    };
  }

  return state;
};
