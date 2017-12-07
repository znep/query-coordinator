import 'regenerator-runtime/runtime';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import _ from 'lodash';

import I18n from 'common/i18n';
import * as coreUtils from 'common/core/utils';
import * as assetActions from '../actions/asset_actions';

// Functions in this file are exported solely for import into tests. They are only called from
// within this file itself.
export function* fetchApprovalForResource(resourceId) {
  const approvalsResponse = yield call(coreUtils.fetchApprovalsForResource, resourceId);

  if (!_.isObject(approvalsResponse) || _.isEmpty(approvalsResponse.details)) {
    throw new Error(`Approvals response for ${resourceId} is invalid.`);
  }

  // Core returns two `details` objects, one of which is "not_applicable".
  // This is in regards to one being an "official" approval setting, and one being "community", and
  // only one is applicable at a given time.
  return _(approvalsResponse.details).
    filter((approvalDetail) => approvalDetail.state !== 'not_applicable').first();
}

export function* setApprovalForResource(resource) {
  const { name, notes, resourceId, state } = resource;
  const approval = yield call(fetchApprovalForResource, resourceId);
  const alertMessageLocaleScope = `shared.asset_browser.alert_messages.resource_${state}`;

  try {
    const title = I18n.t('title', { scope: alertMessageLocaleScope, resourceName: name });
    const body = I18n.t('body', { scope: alertMessageLocaleScope });

    yield call(coreUtils.setApprovalForResource, { approval, resource });
    yield put(assetActions.showAlert(title, body));
  } catch (error) {
    console.error('setApprovalForResource error encountered: ' + error);
    const title = I18n.t('error_title', { scope: alertMessageLocaleScope, resourceName: name });
    const body = I18n.t('error_body', { scope: alertMessageLocaleScope });

    yield put(assetActions.showAlert(title, body));
  }
}

const approvalsSagas = [
  takeEvery(assetActions.APPROVE_RESOURCE_REQUESTED, setApprovalForResource),
  takeEvery(assetActions.REJECT_RESOURCE_REQUESTED, setApprovalForResource)
];

export default approvalsSagas;
