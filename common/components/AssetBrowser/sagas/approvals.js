import 'regenerator-runtime/runtime';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import _ from 'lodash';

import I18n from 'common/i18n';
import * as coreUtils from 'common/core/utils';
import * as assetActions from '../actions/asset_actions';

export function* fetchApprovalForResource(resourceId) {
  const approvalsResponse = yield call(coreUtils.fetchApprovalsForResource, resourceId);

  if (!_.isObject(approvalsResponse) || _.isEmpty(approvalsResponse.details)) {
    throw new Error(`Approvals response for ${resourceId} is invalid.`);
  }

  // Core returns two `details` objects, one of which is "not_applicable".
  // This is in regards to one being an "official" approval setting, and one being "community", and
  // only one is applicable at a given time.
  return _(approvalsResponse.details).filter((approvalDetail) =>
    approvalDetail.state !== 'not_applicable').first();
}

export function* setApprovalForResource(resource) {
  const { name, notes, resourceId, state } = resource;
  const approval = yield call(fetchApprovalForResource, resourceId);
  const alertMessageLocaleScope = `shared.asset_browser.alert_messages.resource_${state}`;

  try {
    const recordId = _.get(approval, 'id');

    if (!recordId) {
      throw new Error(`Missing record ID for resource ${resourceId}. Is it a pending resource?`);
    }

    const requestProps = {
      resourceId,
      recordId,
      body: { notes, state }
    };

    yield call(coreUtils.setApprovalForPendingResource, requestProps);

    const title = I18n.t('title', { scope: alertMessageLocaleScope, resourceName: name });
    const body = I18n.t('body', { scope: alertMessageLocaleScope });
    yield put(assetActions.showAlert(title, body));
  } catch (e) {
    console.error(e);
    const title = I18n.t('error_title', { scope: alertMessageLocaleScope, resourceName: name });
    const body = I18n.t('error_body', { scope: alertMessageLocaleScope });
    yield put(assetActions.showAlert(title, body));
  }
}

const approvalsSagas = [
  takeEvery('APPROVE_RESOURCE_REQUESTED', setApprovalForResource),
  takeEvery('REJECT_RESOURCE_REQUESTED', setApprovalForResource)
];

export default approvalsSagas;
