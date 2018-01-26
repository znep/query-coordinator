import _ from 'lodash';
import { fetchJsonWithDefaultHeaders } from 'common/http';

export const manualApprovalRequiredForView = (coreView = {}) => {
  const viewProvenance = coreView.provenance || 'official';
  const approvalSettings = _.get(window, 'socrata.approvals.settings', {});
  return approvalSettings[viewProvenance] === 'manual';
};

// TODO: gate this on a specific right instead: see_approval_required_on_publish
export const currentUserHasRights = () => !_.isEmpty(_.get(window, 'socrata.currentUser.rights'));

export const assetIsApproved = (coreView) => _.get(getPublicizedApproval(coreView), 'state') === 'approved';

export const fetchPublishedCoreView = (publishedViewUid) =>
  fetchJsonWithDefaultHeaders(`/api/views/${publishedViewUid}.json`, { credentials: 'same-origin' });

export const assetIsPublic = (coreView) => _.includes(_.get(coreView, 'grants.0.flags'), 'public');

const getPublicizedApproval = (coreView = {}) =>
  _.find(coreView.approvals, (approval) => approval.outcome === 'publicize');
