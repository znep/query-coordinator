import _ from 'lodash';
import { fetchJsonWithDefaultHeaders } from 'common/http';

export const manualApprovalRequiredForProvenanceType = (coreView = {}) => {
  const viewProvenance = coreView.provenance || 'official';
  const approvalSettings = _.get(window, 'socrata.approvals.settings', {});
  return approvalSettings[viewProvenance] === 'manual';
};

// TODO: gate this on a specific right instead: see_approval_required_on_publish
export const currentUserHasRights = () => !_.isEmpty(_.get(window, 'socrata.currentUser.rights'));

export const assetIsPending = (coreView) => _.get(getPublicizedApproval(coreView), 'state') === 'pending';
export const assetIsApproved = (coreView) => _.get(getPublicizedApproval(coreView), 'state') === 'approved';
export const assetIsRejected = (coreView) => _.get(getPublicizedApproval(coreView), 'state') === 'rejected';

export const fetchPublishedCoreView = (publishedViewUid) =>
  fetchJsonWithDefaultHeaders(`/api/views/${publishedViewUid}.json`, { credentials: 'same-origin' });

export const assetIsPublic = (coreView) => _.get(coreView, 'grants', []).some(
  (grant) => _.get(grant, 'flags', []).some((flag) => flag === 'public')
);

export const getPublicizedApproval = (coreView = {}) =>
  _.find(coreView.approvals, (approval) => approval.outcome === 'publicize');
