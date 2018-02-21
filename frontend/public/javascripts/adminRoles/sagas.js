import Immutable from 'immutable';
import partition from 'lodash/fp/partition';
import property from 'lodash/fp/property';
import { delay } from 'redux-saga';
import { all, call, put, race, select, take, takeEvery } from 'redux-saga/effects';

import CoreApi from 'common/core-roles-api';

import * as Actions from './actions';
import * as Selectors from './adminRolesSelectors';
import { keyIn } from './lib/utils';

const NOTIFICATION_DELAY = 2500;

export function* loadData() {
  yield put(Actions.loadDataStart());

  try {
    const [rightCategories, roles] = yield all([call(CoreApi.getAllRights), call(CoreApi.getAllRoles)]);
    yield put(Actions.loadDataSuccess({ rightCategories, roles }));
  } catch (error) {
    console.error('Error while loading data', error);
    yield put(Actions.showNotificationError('screens.admin.roles.alerts.load_data.error_html'));
    yield put(Actions.loadDataFailure(error));
  }
}

export function* showNotification() {
  yield delay(NOTIFICATION_DELAY);
  yield put(Actions.showNotificationEnd());
}

export function* handleRoleModal() {
  const maxCharacterCount = yield select(Selectors.getMaxCharacterCountFromState);
  do {
    const action = yield race({
      submit: take(Actions.EDIT_CUSTOM_ROLE_MODAL_SUBMIT),
      cancel: take(Actions.EDIT_CUSTOM_ROLE_MODAL_CANCEL)
    });

    if (action.submit) {
      const role = yield select(Selectors.getEditingRoleFromState);
      const validatedRole = Selectors.validateRole(maxCharacterCount, role);
      if (!Selectors.roleHasError(validatedRole)) {
        return validatedRole;
      }
    } else {
      break;
    }
  } while (true);
}

export function* renameRole() {
  const validatedRole = yield handleRoleModal();
  if (validatedRole) {
    yield put(Actions.saveRoles(Immutable.fromJS([validatedRole])));
  }
}

export function* createRole() {
  const validatedRole = yield handleRoleModal();
  if (validatedRole) {
    yield put(Actions.createNewRoleStart());
  }
}

export const getRights = role => role.filter(keyIn('name', 'rights')).toJS();
export function* buildCreateRoleCall(role) {
  try {
    const success = yield call(CoreApi.createRole, getRights(role));
    return { role, success };
  } catch (error) {
    return { role, error };
  }
}

export function* buildUpdateRoleCall(role) {
  try {
    const success = yield call(CoreApi.updateRole, Selectors.getIdFromRole(role), getRights(role));
    return { role, success };
  } catch (error) {
    return { role, error };
  }
}

export const mapRoleToCall = role =>
  call(Selectors.roleIsNew(role) ? buildCreateRoleCall : buildUpdateRoleCall, role);

export function* saveRoles({ payload: { roles } }) {
  yield put(Actions.saveRolesStart());
  const requestCalls = roles.map(mapRoleToCall).toJS();
  try {
    const responses = yield all(requestCalls);
    const [successes, errors] = partition(property('success'), responses);
    if (errors.length === 0) {
      yield put(Actions.showNotificationSuccess('screens.admin.roles.alerts.save_roles.success_html'));
      yield put(Actions.saveRolesSuccess(successes));
    } else {
      yield put(
        Actions.showNotificationError('screens.admin.roles.alerts.save_roles.error_html', {
          error: errors.map(({ error }) => error.message).join('\n')
        })
      );
      yield put(Actions.saveRolesFailure());
    }
  } catch (error) {
    console.error('Unexpected error saving roles', error);
  }
}

export function* deleteRole({ payload: { role } }) {
  yield put(Actions.deleteRoleStart(role));
  try {
    yield call(CoreApi.deleteRole, Selectors.getIdFromRole(role));
    yield put(Actions.showNotificationSuccess('screens.admin.roles.alerts.delete_role.success_html'));
    yield put(Actions.deleteRoleEnd());
  } catch (error) {
    console.error('Error while deleting role', error);
    yield put(Actions.showNotificationError('screens.admin.roles.alerts.delete_role.error_html'));
    yield put(Actions.deleteRoleCancel());
  }
}

export default function* rootSaga() {
  yield all([
    takeEvery(Actions.DELETE_ROLE, deleteRole),
    takeEvery(Actions.SAVE_ROLES, saveRoles),
    takeEvery(Actions.SHOW_NOTIFICATION, showNotification),
    takeEvery(Actions.NEW_CUSTOM_ROLE, createRole),
    takeEvery(Actions.RENAME_ROLE, renameRole),
    takeEvery(Actions.LOAD_DATA, loadData)
  ]);
}
