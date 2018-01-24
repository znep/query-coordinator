import _ from 'lodash';
import * as helpers from './helpers';

// EN-21106: Returns Promise of whether the given asset will enter the approvals queue when it is published.
// TODO: ideally this logic would just be done within Core and included in the asset's coreView.
export const assetWillEnterApprovalsQueueOnPublish = ({ coreView, assetWillBePublic }) => {
  const getResult = (assetIsAutoApproved) => (
    !assetIsAutoApproved &&
    helpers.currentUserHasRights() &&
    (helpers.assetIsPublic(coreView) || assetWillBePublic) &&
    helpers.manualApprovalRequiredForView(coreView)
  );

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
