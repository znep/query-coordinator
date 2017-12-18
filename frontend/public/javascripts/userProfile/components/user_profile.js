import _ from 'lodash';
import React, { Component } from 'react';

import AssetBrowser from 'common/components/AssetBrowser';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import { getCurrentUserId, getTargetUserId } from 'common/components/AssetBrowser/lib/helpers/cetera';

export default class UserProfile extends Component {
  render() {
    const tabs = {
      [constants.MY_ASSETS_TAB]: {
        component: ResultsAndFilters,
        props: {
          baseFilters: {
            forUser: getTargetUserId()
          }
        }
      }
    };

    const targetUserId = _.get(window, 'socrata.initialState.targetUserId');

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

    const showManageAssets = _.includes(serverConfig.currentUser.flags, 'admin') ||
      !_.isEmpty(window.serverConfig.currentUser.roleName);

    // If user has no roles, don't show visibility column (EN-20845)
    if (_.isNil(window.serverConfig.currentUser.roleId) && window.socrata.initialState.catalog.columns) {
      _.remove(window.socrata.initialState.catalog.columns, (col) => col === 'visibility');
    }

    return (
      <AssetBrowser
        enableAssetInventoryLink={false}
        pageSize={5}
        showAssetCounts={false}
        showFilters={false}
        showHeader
        showManageAssets={showManageAssets}
        showResultCount
        showSearchField
        tabs={tabs} />
    );
  }
}
