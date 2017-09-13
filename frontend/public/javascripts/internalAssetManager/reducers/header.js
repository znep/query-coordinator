import _ from 'lodash';

const defaultTab = () => 'allAssets';

const getInitialState = () => ({
  activeTab: _.get(window, 'initialState.initialFilters.tab') || defaultTab()
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
