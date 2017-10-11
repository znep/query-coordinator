import _ from 'lodash';

const defaultTab = 'myQueue';

const initialState = {}; // TODO: parse initialState from url params

const getInitialState = () => ({
  activeTab: initialState.activeTab || defaultTab
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'CHANGE_TAB') {
    return {
      ...state,
      activeTab: action.newTab
    };
  }

  return state;
};
