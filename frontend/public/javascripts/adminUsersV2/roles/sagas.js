import { call, put, takeEvery } from 'redux-saga/effects';
import CoreRolesApi from 'common/core-roles-api';
import { browserHistory } from 'react-router';
import * as Actions from './actions';
import * as GlobalActions from '../actions';

import get from 'lodash/fp/get';
import map from 'lodash/fp/map';

const mapRoles = map(({ id, ...rest }) => ({ ...rest, id: id.toString() }));
const sortRoles = (a, b) => {
  if (a.isDefault === b.isDefault) {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  } else {
    return a.isDefault ? -1 : 1;
  }
};

export function* changeUserRole({ payload: { userId, newRole }}) {
  try {
    const response = yield call(CoreRolesApi.assignRoleToUser, userId, newRole);
    const newRoleName = get('newRole.name', response);
    yield put(Actions.changeUserRoleSuccess(userId, newRole, newRoleName));
    yield put(GlobalActions.showLocalizedSuccessNotification('users.notifications.role_changed'));
  } catch (error) {
    console.warn(`Unable to change user role for user ID ${userId} and role ${newRole}`, error);
    yield put(Actions.changeUserRoleFailure(userId, error));
    if (error.status === 400) {
      const data = error.json();
      if (data.message === 'Cannot change your own role') {
        yield put(GlobalActions.showLocalizedErrorNotification('users.errors.own_role'));
      } else {
        yield put(GlobalActions.showLocalizedErrorNotification('users.errors.unknown'));
      }
    }
  }
}

export function* changeUserRoleFilter({ payload: { roleId }}) {
  yield put(GlobalActions.gotoUserPage(1));
  const currentLocation = yield call(browserHistory.getCurrentLocation);
  const location = Object.assign({}, currentLocation);
  const query = roleId === 'all' ? { roleId: undefined } : { roleId };
  Object.assign(location.query, query);
  yield call(browserHistory.push, location);
}

export function* loadRoles() {
  try {
    const roleData = yield call(CoreRolesApi.getAllRoles);
    const roles = mapRoles(roleData).sort(sortRoles);
    yield put(Actions.loadRolesSuccess(roles));
  } catch (error) {
    console.warn('Unable to load roles, using empty list.', error);
    yield put(Actions.loadRolesFailure(error));
  }
}

export function* removeUserRole({ payload: { userId, roleId }}) {
  try {
    yield call(CoreRolesApi.removeRoleFromUser, userId, roleId);
    yield put(Actions.removeUserRoleSuccess(userId, roleId));
    yield put(GlobalActions.showLocalizedSuccessNotification('users.notifications.role_removed'));
  } catch (error) {
    console.warn(`Unable to remove user role for user ID ${userId} and role ${roleId}`, error);
    yield put(Actions.removeUserRoleFailure(userId, error));
    if (error.status === 400) {
      const data = error.json();
      if (data.message === 'Cannot change your own role') {
        yield put(GlobalActions.showLocalizedErrorNotification('users.errors.own_role'));
      } else {
        yield put(GlobalActions.showLocalizedErrorNotification('users.errors.unknown'));
      }
    }
  }
}

export default [
  takeEvery(Actions.CHANGE_USER_ROLE, changeUserRole),
  takeEvery(Actions.CHANGE_USER_ROLE_FILTER, changeUserRoleFilter),
  takeEvery(Actions.LOAD_ROLES, loadRoles),
  takeEvery(Actions.REMOVE_USER_ROLE, removeUserRole)
];
