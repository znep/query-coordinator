import { takeEvery, takeLatest, call, put, select } from 'redux-saga/effects';

import {
  permissionsUrl,
  fetchJsonWithDefaults,
  publishUrl,
  shouldPublishOnSave,
  checkWillEnterApprovalQueue
} from 'common/components/AccessManager/Util';

import { MODES, PUBLISHED_VIEWER_ACCESS_LEVEL } from 'common/components/AccessManager/Constants';

import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';
import * as uiActions from 'common/components/AccessManager/actions/UiActions';

import * as selectors from './Selectors';

// fetch all the permissions from the api
export function* fetchPermissions() {
  const view = yield select(selectors.getCurrentView);
  const uiMode = yield select(selectors.getUiMode);

  try {
    const permissions = yield call(fetchJsonWithDefaults, permissionsUrl(view.id));

    // sometimes core replies back with a 200...
    // but an "error" boolean means there's _really_ an error
    if (permissions.error) {
      yield put(permissionsActions.fetchPermissionsFail(permissions));
    } else {
      // need to check if the asset will enter the approval queue
      if (uiMode === MODES.CHANGE_AUDIENCE || uiMode === MODES.PUBLISH) {
        yield checkWillEnterApprovalQueue(view, permissions.scope);
      }

      yield put(permissionsActions.fetchPermissionsSuccess(permissions));
    }
  } catch (error) {
    yield put(permissionsActions.fetchPermissionsFail(error));
  }
}

export function* publishView(assetUid) {
  const publishedView = yield call(
    fetchJsonWithDefaults,
    publishUrl(assetUid),
    { method: 'POST' }
  );

  const { id } = publishedView;

  if (!publishedView || !id) {
    throw new Error('Error publishing asset', publishedView);
  } else {
    yield put(uiActions.redirectTo(`/d/${id}`));
  }
}

export function* addSelectedUsers(mode) {
  // need to check if any users have been selected but not added yet, and then add them
  let selectedUsers;
  let selectedAccessLevel;
  if (mode === MODES.PUBLISH || mode === MODES.CHANGE_AUDIENCE) {
    // if we're in a mode where we're changing who the asset is published to,
    // grab the users from the proper state tree and set the access level to the default of published viewer
    selectedUsers = yield select(selectors.getSelectedPublishTo);
    selectedAccessLevel = PUBLISHED_VIEWER_ACCESS_LEVEL;
  } else {
    // else just grant the users and access level from the state
    selectedUsers = yield select(selectors.getSelectedUsers);
    selectedAccessLevel = yield select(selectors.getAccessLevel);
  }

  // add any users that have been selected, but not added
  if (selectedUsers.length > 0) {
    yield put(permissionsActions.addUsers(selectedUsers, selectedAccessLevel));
  }
}

// persist all the permissions to the database
export function* savePermissions() {
  const mode = yield select(selectors.getUiMode);
  const assetUid = yield select(selectors.getAssetUid);

  // add any selected users
  yield call(addSelectedUsers, mode);

  const permissions = yield select(selectors.getPermissions);

  try {
    yield call(
      fetchJsonWithDefaults,
      permissionsUrl(assetUid),
      {
        method: 'PUT',
        body: JSON.stringify(permissions)
      }
    );

    if (shouldPublishOnSave(mode)) {
      yield call(publishView, assetUid);
    } else {
      yield put(permissionsActions.saveSuccess());
    }
  } catch (error) {
    yield put(permissionsActions.saveFail(error));
  }
}

export default [
  takeEvery(permissionsActions.FETCH_PERMISSIONS, fetchPermissions),
  takeLatest(uiActions.SAVE_BUTTON_CLICKED, savePermissions)
];
