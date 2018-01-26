import { delay } from 'redux-saga';
import { takeLatest, call, put, select } from 'redux-saga/effects';

import { checkWillEnterApprovalQueue } from 'common/components/AccessManager/Util';

import { TOAST_NOTIFICATION_MILLISECONDS, MODES } from 'common/components/AccessManager/Constants';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';
import * as uiActions from 'common/components/AccessManager/actions/UiActions';

import * as selectors from './Selectors';

// when the save is successful, the UiReducer will add a toast notification
// this saga will, at the same time, start a timer that automatically dismisses the notification
function* saveSuccess() {
  // delay will essentially pause this saga for the given amount of time,
  // then put the "dismiss" action to the UiReducer which will handle actually hiding the notification
  yield call(delay, TOAST_NOTIFICATION_MILLISECONDS);
  yield put(uiActions.dismissToastMessage());
}

function* changeAudienceScope(action) {
  const coreView = yield select(selectors.getCurrentView);
  const { scope } = action;

  yield checkWillEnterApprovalQueue(coreView, scope);
}

function* showAccessManager(action) {
  const coreView = yield select(selectors.getCurrentView);
  const permissions = yield select(selectors.getPermissions);
  const { mode } = action;

  // need to check if the asset will enter the approval queue
  if (mode === MODES.CHANGE_AUDIENCE || mode === MODES.PUBLISH) {
    yield checkWillEnterApprovalQueue(coreView, permissions ? permissions.scope : null);
  }
}

export default [
  takeLatest(uiActions.SHOW_ACCESS_MANAGER, showAccessManager),
  takeLatest(permissionsActions.SAVE_SUCCESS, saveSuccess),
  takeLatest(permissionsActions.CHANGE_AUDIENCE_SCOPE, changeAudienceScope)
];
