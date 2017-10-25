import _ from 'lodash';

import { getQueryParameter } from 'common/components/AssetBrowser/lib/query_string';

const getInitialState = () => ({
  activeTab: getQueryParameter({ key: 'tab', defaultValue: window.initialState.header.initialTab })
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
