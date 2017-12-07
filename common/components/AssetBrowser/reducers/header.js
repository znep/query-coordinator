import _ from 'lodash';

import * as constants from 'common/components/AssetBrowser/lib/constants';
import { getQueryParameter } from 'common/components/AssetBrowser/lib/query_string';
import * as headerActions from 'common/components/AssetBrowser/actions/header';

const getInitialState = () => {
  return {
    activeTab: getQueryParameter('tab', window.initialState.header.initialTab)
  };
};

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === headerActions.CHANGE_TAB) {
    return {
      ...state,
      activeTab: action.newTab
    };
  }

  return state;
};
