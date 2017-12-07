import _ from 'lodash';
import { defaultHeaders, fetchJson } from 'common/http';
import * as helpers from './helpers';
import * as constants from 'common/components/AssetBrowser/lib/constants.js';

export const fetchApprovalsForResource = (resourceId) => {
  helpers.checkValidResourceId(resourceId);

  return fetchJson(`/api/views/${resourceId}/approvals`, {
    credentials: 'same-origin',
    headers: defaultHeaders
  });
};

export const setApprovalForResource = ({ approval, resource }) => {
  const { notes, resourceId, state } = resource;
  const { id: recordId, state: previousState } = approval;

  helpers.checkValidResourceId(resourceId);
  helpers.checkValidRecordId(recordId);

  let path = `/api/views/${resourceId}/approvals/${recordId}`;
  if (previousState !== constants.APPROVAL_STATUS_PENDING) {
    path = `${path}?method=redoStateOnRecord`;
  }

  return fetchJson(path, {
    body: JSON.stringify({ notes, state }),
    credentials: 'same-origin',
    headers: defaultHeaders,
    method: 'PUT'
  });
};
