import _ from 'lodash';

import * as constants from 'common/components/AssetBrowser/lib/constants';
import { getQueryParameter } from 'common/components/AssetBrowser/lib/query_string';
import * as headerActions from 'common/components/AssetBrowser/actions/header';

export default (state = {}, action) => {
  if (action.type === headerActions.SET_INITIAL_TAB) {
    return {
      ...state,
      activeTab: action.initialTab
    };
  }

  if (action.type === headerActions.CHANGE_TAB) {
    return {
      ...state,
      activeTab: action.newTab
    };
  }

  return state;
};
