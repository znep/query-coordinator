import 'regenerator-runtime/runtime';
import * as actions from '../actions/settings';
import { call, put, takeEvery } from 'redux-saga/effects';

function* fetchSettings() {
  try {
    const response = yield call(
      fetch,
      '/api/approvals',
      { credentials: 'same-origin' }
    );
    const approvals = yield response.json();

    if (approvals.error) {
      yield put(actions.fetchSettingsFail(approvals));
    } else {
      yield put(actions.fetchSettingsSuccess(approvals));
    }
  } catch (error) {
    yield put(actions.fetchSettingsFail(error));
  }
}

export default [
  takeEvery(actions.FETCH_SETTINGS, fetchSettings)
];
