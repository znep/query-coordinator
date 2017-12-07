import _ from 'lodash';
import React, { Component } from 'react';

import AssetBrowser from 'common/components/AssetBrowser';
import { ApprovalActionButtons } from 'common/components/AssetBrowser/components';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import SettingsContainer from 'common/components/AssetBrowser/components/approvals/settings/settings_container';
import { SocrataIcon } from 'common/components';

export default class Approvals extends Component {
  render() {
    const tabs = {
      [constants.MY_QUEUE_TAB]: {
        component: ResultsAndFilters,
        props: {
          actionElement: ApprovalActionButtons,
          baseFilters: {
            approvalStatus: constants.APPROVAL_STATUS_PENDING
          }
        }
      },
      [constants.HISTORY_TAB]: {
        component: ResultsAndFilters,
        props: {
          actionElement: ApprovalActionButtons,
          baseFilters: {
            approvalStatus: [constants.APPROVAL_STATUS_APPROVED, constants.APPROVAL_STATUS_REJECTED]
          }
        }
      }
    };

    let settingsLink = null;
    if (_.includes(serverConfig.currentUser.rights, 'configure_approvals')) {
      settingsLink = (
        <div className="settings_link">
          <SocrataIcon name="settings" />
          <a href={`/admin/approvals/settings/${window.socrata.initialState.approvalWorkflowId}`}>
            {/*I18n.t('approval_settings', { scope: this.scope })*/}Approvals Settings
          </a>
        </div>
      );
    }

    return <AssetBrowser showAssetCounts={false} showFilters showSearchField tabs={tabs} settings={settingsLink} />;
  }
}
