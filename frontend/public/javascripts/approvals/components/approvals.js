import _ from 'lodash';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import AssetBrowser from 'common/components/AssetBrowser';
import { ApprovalActionButtons } from 'common/components/AssetBrowser/components';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import { SocrataIcon } from 'common/components';

export default class Approvals extends Component {
  scope = 'approvals.header.breadcrumbs';

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

    const approvalWorkflowId = _.get(window, 'socrata.assetBrowser.staticData.approvalWorkflowId');
    const settingsLink = _.includes(window.socrata.currentUser.rights, 'configure_approvals') ? (
      <div className="settings_link">
        <SocrataIcon name="settings" />
        <a href={`/admin/approvals/settings/${approvalWorkflowId}`}>
          {I18n.t('approvals_settings', { scope: this.scope })}
        </a>
      </div>
    ) : null;


    return (
      <AssetBrowser
        columns={['type', 'name', 'submitted_at', 'owner', 'status', 'actions']}
        initialTab={constants.MY_QUEUE_TAB}
        showAssetCounts={false}
        showFilters
        showSearchField
        tabs={tabs}
        settings={settingsLink} />
    );
  }
}
