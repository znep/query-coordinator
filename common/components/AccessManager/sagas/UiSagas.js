import { delay } from 'redux-saga';
import { takeLatest, call, put } from 'redux-saga/effects';

import { TOAST_NOTIFICATION_MILLISECONDS } from '../Constants';
import * as permissionsActions from '../actions/PermissionsActions';
import * as uiActions from '../actions/UiActions';

// when the save is successful, the UiReducer will add a toast notification
// this saga will, at the same time, start a timer that automatically dismisses the notification
function* saveSuccess() {
  // delay will essentially pause this saga for the given amount of time,
  // then put the "dismiss" action to the UiReducer which will handle actually hiding the notification
  yield call(delay, TOAST_NOTIFICATION_MILLISECONDS);
  yield put(uiActions.dismissToastMessage());
}

export default [
  takeLatest(permissionsActions.SAVE_SUCCESS, saveSuccess)
];
