import _ from 'lodash';

import * as actions from 'actions';

const initialState = () => {
  const state = window.initialState;

  _.assign(state, {
    activePane: 'summary'
  });

  return state;
};

export default (state = initialState(), action) => {
  if (_.isUndefined(action)) {
    return state;
  }

  switch (action.type) {
    case actions.SET_ACTIVE_PANE:
      return {
        ...state,
        activePane: action.activePane
      };

    default:
      return state;
  }
};
