import _ from 'lodash';
import { FeatureFlags } from 'common/feature_flags';
import * as helpers from './helpers';

// EN-21106: Returns Promise of whether the given asset will enter the approvals queue when it is published.
// TODO: ideally this logic would just be done within Core and included in the asset's coreView.
export const assetWillEnterApprovalsQueueOnPublish = ({ coreView, assetWillBePublic }) => {
  if (!FeatureFlags.value('use_fontana_approvals')) {
    return Promise.resolve(false);
  }

  const getResult = (assetIsAutoApproved) => {
    return !!(
      !assetIsAutoApproved &&
      helpers.currentUserHasRights() &&
      (helpers.assetIsPublic(coreView) || assetWillBePublic) &&
      helpers.manualApprovalRequiredForProvenanceType(coreView)
    );
  };

  if (coreView.publishedViewUid) {
    // If the asset has a publishedViewUid then we check its published view for the 'approved' status.
    return (
      helpers.fetchPublishedCoreView(coreView.publishedViewUid).then((publishedCoreView) =>
        getResult(helpers.assetIsApproved(publishedCoreView))
      )
    );
  } else {
    return Promise.resolve(getResult(helpers.assetIsApproved(coreView)));
  }
};

// Same as above, but without the need to check for auto-approval since this is a new derived view.
export const derivedViewWillEnterApprovalsQueueOnSave = ({ parentCoreView }) => {
  return !!(
    FeatureFlags.value('use_fontana_approvals') &&
    helpers.currentUserHasRights() &&
    helpers.assetIsPublic(parentCoreView) &&
    helpers.manualApprovalRequiredForProvenanceType(parentCoreView)
  );
};

// EN-21598: Returns Promise of whether the given asset will enter the approvals queue when it is made Public
export const assetWillEnterApprovalsQueueWhenMadePublic = ({ coreView }) => {
  if (!FeatureFlags.value('use_fontana_approvals')) {
    return Promise.resolve(false);
  }

  const getResult = (assetIsAutoApproved) => {
    return !!(
      !assetIsAutoApproved &&
      helpers.currentUserHasRights() &&
      helpers.manualApprovalRequiredForProvenanceType(coreView)
    );
  };

  if (coreView.publishedViewUid) {
    // If the asset has a publishedViewUid then we check its published view for the 'approved' status.
    return (
      helpers.fetchPublishedCoreView(coreView.publishedViewUid).then((publishedCoreView) =>
        getResult(helpers.assetIsApproved(publishedCoreView))
      )
    );
  } else {
    return Promise.resolve(getResult(helpers.assetIsApproved(coreView)));
  }
};
