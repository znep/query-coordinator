import { takeEvery, takeLatest, call, put, select } from 'redux-saga/effects';
import * as actions from '../actions/AccessManagerActions';
import * as selectors from './Selectors';
import { isPublicPermission } from '../Util';

export function* fetchPermissions() {
  const assetUid = yield select(selectors.getAssetUid);

  try {
    const response = yield call(
      fetch,
      `/api/views/${assetUid}/permissions`,
      {
        credentials: 'same-origin'
      }
    );
    const permissions = yield call(response.json.bind(response));

    // sometimes core replies back with a 200...
    // but an "error" boolean means there's _really_ an error
    if (permissions.error) {
      yield put(actions.fetchPermissionsFail(permissions));
    } else {
      yield put(actions.fetchPermissionsSuccess(permissions));
    }
  } catch (error) {
    yield put(actions.fetchPermissionsFail(error));
  }
}

export function* savePermissions() {
  const assetUid = yield select(selectors.getAssetUid);
  const permissions = yield select(selectors.getPermissions);

  const isPublic = permissions.some(isPublicPermission);
  const value = isPublic ? 'public.read' : 'private';

  // NOTE: This will eventually be part of the new API and will have to change
  try {
    yield call(
      fetch,
      `/api/views/${assetUid}?accessType=WEBSITE&method=setPermission&value=${value}`,
      {
        method: 'PUT',
        credentials: 'same-origin'
      }
    );

    // if the above results in a 5xx or a 4xx, then it goes to the catch block
    // core returns an empty 200 so there's nothing to really do with the response...
    yield put(actions.saveSuccess());
  } catch (error) {
    yield put(actions.saveFail(error));
  }
}

export default [
  takeEvery(actions.FETCH_PERMISSIONS, fetchPermissions),
  takeLatest(actions.SAVE_BUTTON_CLICKED, savePermissions)
];
