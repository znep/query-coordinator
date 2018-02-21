/* eslint-disable import/default */

import { FeatureFlags } from 'common/feature_flags';
import Visualizations from 'common/visualizations';
import { assetWillEnterApprovalsQueueWhenMadePublic } from 'common/asset/utils';
import { assetIsPending } from 'common/asset/utils/helpers';

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

    // EN-21596: Show approval warning message in the Save new derived view dialog
    document.getElementById('save-new-derived-view-approval-message').style.display = 'inherit';

    // EN-21598: Show approval message next to "Public" radio button if the asset is currently private.
    if (!blist.dataset.isPublic()) {
      // The element isn't actually rendered until the user clicks the Manage button, so we can't
      // just select it and modify its style like the others.
      window.socrata.approvals.showManagePermissionsApprovalMessage = true;
    }

    blist.dataset.pendingApproval = assetIsPending(blist.dataset);
  }
}

window.onload = () => {
  if (!FeatureFlags.value('enable_new_dataset_sharing_ux')) {
    assetWillEnterApprovalsQueueWhenMadePublic({
      coreView: window.blist.dataset
    }).then((result) => updatePageBasedOnApprovalOutcome(result));
  }
};
