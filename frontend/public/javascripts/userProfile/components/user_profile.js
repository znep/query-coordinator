import _ from 'lodash';
import React, { Component } from 'react';

import AssetBrowser from 'common/components/AssetBrowser';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import { getCurrentUserId } from 'common/components/AssetBrowser/lib/helpers/cetera';

export default class UserProfile extends Component {
  render() {
    const targetUserId = _.get(window, 'socrata.assetBrowser.staticData.targetUserId');

    const tabs = {
      [constants.MY_ASSETS_TAB]: {
        component: ResultsAndFilters,
        props: {
          baseFilters: {
            forUser: targetUserId
          }
        }
      }
    };

    // Only show SHARED_TO_ME_TAB if user is on their own profile
    if (_.eq(getCurrentUserId(), targetUserId)) {
      tabs[constants.SHARED_TO_ME_TAB] = {
        component: ResultsAndFilters,
        props: {
          baseFilters: {
            sharedTo: getCurrentUserId()
          }
        }
      };
    } else {
      // If not on their own profile, user should only see public assets
      tabs[constants.MY_ASSETS_TAB].props.baseFilters.visibility = 'open';
    }

    const currentUser = window.socrata.currentUser;
    const showManageAssets = _.includes(currentUser.flags, 'admin') || !_.isEmpty(currentUser.roleName);

    const columns = ['type', 'name', 'actions', 'lastUpdatedDate', 'category', 'owner', 'visibility'];
    // If user has no roles and is not an admin, don't show visibility column (EN-20845)
    if (_.isUndefined(currentUser.roleId) && !_.includes(currentUser.flags, 'admin')) {
      _.remove(columns, (column) => column === 'visibility');
    }

    return (
      <AssetBrowser
        columns={columns}
        enableAssetInventoryLink={false}
        initialTab={constants.MY_ASSETS_TAB}
        pageSize={5}
        showAssetCounts={false}
        showFilters={false}
        showHeader
        showManageAssets={showManageAssets}
        showSearchField
        tabs={tabs} />
    );
  }
}
