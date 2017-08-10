import _ from 'lodash';
import { FeatureFlags } from 'common/feature_flags';

const defaultTab = () => (
  FeatureFlags.value('enable_internal_asset_manager_my_assets') ? 'myAssets' : 'allAssets'
);

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
