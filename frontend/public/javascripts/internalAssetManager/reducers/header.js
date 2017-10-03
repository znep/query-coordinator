import _ from 'lodash';

const defaultTab = () => {
  if (_.includes(
        _.get(window.serverConfig, 'currentUser.rights', []),
        'can_see_all_assets_tab_siam'
  )) {
    return 'allAssets';
  } else {
    return 'myAssets';
  }
};

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
