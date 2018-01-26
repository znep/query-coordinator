import { delay } from 'redux-saga';
import { all, put, takeEvery } from 'redux-saga/effects';
import * as Actions from './actions';
import teamsSagas from './teams/sagas';
import rolesSagas from './roles/sagas';
import invitedUsersSagas from './invitedUsers/sagas';
import usersSagas from './users/sagas';

export function* showNotification() {
  yield delay(2500);
  yield put(Actions.hideNotification());
}

export default function* rootSaga() {
  yield all([
    ...invitedUsersSagas,
    ...rolesSagas,
    ...teamsSagas,
    ...usersSagas,
    takeEvery(Actions.SHOW_NOTIFICATION, showNotification)
  ]);
}
