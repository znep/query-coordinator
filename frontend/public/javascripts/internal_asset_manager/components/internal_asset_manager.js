import _ from 'lodash';
import React, { Component } from 'react';

import AssetBrowser from 'common/components/AssetBrowser';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import { getCurrentUserId } from 'common/components/AssetBrowser/lib/helpers/cetera';

export default class InternalAssetManager extends Component {
  render() {
    const tabs = {
      [constants.MY_ASSETS_TAB]: {
        component: ResultsAndFilters,
        props: {
          baseFilters: {
            forUser: getCurrentUserId()
          }
        }
      },
      [constants.SHARED_TO_ME_TAB]: {
        component: ResultsAndFilters,
        props: {
          baseFilters: {
            sharedTo: getCurrentUserId()
          }
        }
      }
    };

    if (_.includes(serverConfig.currentUser.rights, 'can_see_all_assets_tab_siam')) {
      tabs[constants.ALL_ASSETS_TAB] = {
        component: ResultsAndFilters
      };
    }

    return (
      <AssetBrowser
        showAssetCounts
        showFilters
        showSearchField
        tabs={tabs} />
    );
  }
}
