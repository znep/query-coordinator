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

    const currentUserRights = window.socrata.currentUser.rights || [];
    const userCanSeeAllAssets = _.includes(currentUserRights, 'can_see_all_assets_tab_siam');

    if (userCanSeeAllAssets) {
      tabs[constants.ALL_ASSETS_TAB] = {
        component: ResultsAndFilters
      };
    }

    const approvalSettings = _.get(window, 'socrata.approvals.settings', {});
    const assetsRequireManualApproval = approvalSettings.official === 'manual' ||
      approvalSettings.community === 'manual';

    return (
      <AssetBrowser
        columns={['type', 'name', 'actions', 'lastUpdatedDate', 'category', 'owner', 'visibility']}
        initialTab={userCanSeeAllAssets ? constants.ALL_ASSETS_TAB : constants.MY_ASSETS_TAB}
        showAssetCounts
        showFilters
        showSearchField
        showAwaitingApprovalFilter={assetsRequireManualApproval}
        tabs={tabs} />
    );
  }
}
