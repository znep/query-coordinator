/* eslint-disable import/default */

import { FeatureFlags } from 'common/feature_flags';
import Visualizations from 'common/visualizations';
import { assetWillEnterApprovalsQueueOnPublish } from 'common/asset/utils';

import ColumnEditor from './column_editor';
import RowEditor from './row_editor';

window.blist = window.blist || {};
window.blist.Visualizations = Visualizations;
window.blist.gridViewColumnEditor = ColumnEditor;
window.blist.gridViewRowEditor = RowEditor;

// The following code shouldn't be necessary once Asset Action Bar is fully rolled out in May #lastwords
function updatePageBasedOnApprovalOutcome(assetWillEnterApprovalsQueue) {
  if (assetWillEnterApprovalsQueue) {

    // EN-21601: If we're on a derived view, conditionally show an approval warning message
    if (blist.dataset.publishedViewUid) {
      document.getElementById('derived-view-approval-message').style.display = 'inherit';
    }

    // EN-21598: Show approval message next to "Public" radio button if the asset is currently private.
    if (!blist.dataset.isPublic()) {
      document.getElementById('manage-permissions-approval-message').style.display = 'inline';
    }
  }
}

window.onload = () => {
  if (!FeatureFlags.value('enable_asset_action_bar')) {
    assetWillEnterApprovalsQueueOnPublish({
      coreView: window.blist.dataset,
      assetWillBePublic: blist.dataset.isPendingPublic()
    }).then((result) => updatePageBasedOnApprovalOutcome(result));
  }
};
