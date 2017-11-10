import _ from 'lodash';
import { defaultHeaders, fetchJson } from 'common/http';
import * as helpers from './helpers';

export const fetchApprovalsForResource = (resourceId) => {
  helpers.checkValidResourceId(resourceId);

  return fetchJson(`/api/views/${resourceId}/approvals`, {
    credentials: 'same-origin',
    headers: defaultHeaders
  });
};

export const setApprovalForPendingResource = ({ resourceId, recordId, body }) => {
  helpers.checkValidResourceId(resourceId);
  helpers.checkValidRecordId(recordId);

  if (!_.isObject(body)) {
    throw new Error('Invalid body for setting approval status.');
  }

  return fetchJson(`/api/views/${resourceId}/approvals/${recordId}`, {
    body: JSON.stringify(body),
    credentials: 'same-origin',
    headers: defaultHeaders,
    method: 'PUT'
  });
};
