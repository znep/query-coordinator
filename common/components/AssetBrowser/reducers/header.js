import _ from 'lodash';

import { ALL_ASSETS_TAB, MY_ASSETS_TAB } from 'common/components/AssetBrowser/lib/constants';
import { getQueryParameter } from 'common/components/AssetBrowser/lib/query_string';

const defaultTab = () => {
  if (_.includes(_.get(window.serverConfig, 'currentUser.rights', []), 'can_see_all_assets_tab_siam')) {
    return ALL_ASSETS_TAB;
  } else {
    return MY_ASSETS_TAB;
  }
};

const getInitialState = () => ({
  activeTab: getQueryParameter({ key: 'tab', defaultValue: defaultTab() })
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
