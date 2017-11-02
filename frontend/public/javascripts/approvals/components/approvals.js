import _ from 'lodash';
import React, { Component } from 'react';

import AssetBrowser from 'common/components/AssetBrowser';
import { ApprovalActionButtons } from 'common/components/AssetBrowser/components';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import SettingsContainer from 'common/components/AssetBrowser/components/approvals/settings/settings_container';

export default class Approvals extends Component {
  render() {
    const tabs = {
      [constants.MY_QUEUE_TAB]: {
        component: ResultsAndFilters,
        props: {
          actionElement: ApprovalActionButtons,
          baseFilters: {
            approvalStatus: 'pending'
          }
        }
      },
      [constants.HISTORY_TAB]: {
        component: () => <div>History! todo</div>
      }
    };

    if (_.includes(serverConfig.currentUser.rights, 'configure_approvals')) {
      tabs[constants.SETTINGS_TAB] = {
        component: SettingsContainer
      };
    }

    return (
      <AssetBrowser
        showAssetCounts={false}
        showFilters
        showSearchField
        tabs={tabs} />
    );
  }
}
