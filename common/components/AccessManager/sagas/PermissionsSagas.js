import { takeEvery, takeLatest, call, put, select } from 'redux-saga/effects';
import { permissionsUrl, fetchWithDefaults } from '../Util';
import * as permissionsActions from '../actions/PermissionsActions';
import * as uiActions from '../actions/UiActions';
import * as selectors from './Selectors';

// fetch all the permissions from the api
export function* fetchPermissions() {
  const assetUid = yield select(selectors.getAssetUid);

  try {
    const response = yield call(fetchWithDefaults, permissionsUrl(assetUid));
    const permissions = yield call(response.json.bind(response));

    // sometimes core replies back with a 200...
    // but an "error" boolean means there's _really_ an error
    if (permissions.error) {
      yield put(permissionsActions.fetchPermissionsFail(permissions));
    } else {
      yield put(permissionsActions.fetchPermissionsSuccess(permissions));
    }
  } catch (error) {
    yield put(permissionsActions.fetchPermissionsFail(error));
  }
}

// persist all the permissions to the database
export function* savePermissions() {
  const assetUid = yield select(selectors.getAssetUid);
  const permissions = yield select(selectors.getPermissions);

  try {
    yield call(
      fetchWithDefaults,
      permissionsUrl(assetUid),
      {
        method: 'PUT',
        body: JSON.stringify(permissions)
      }
    );

    yield put(permissionsActions.saveSuccess());
  } catch (error) {
    yield put(permissionsActions.saveFail(error));
  }
}

export default [
  takeEvery(permissionsActions.FETCH_PERMISSIONS, fetchPermissions),
  takeLatest(uiActions.SAVE_BUTTON_CLICKED, savePermissions)
];
