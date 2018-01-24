import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import { browserHistory } from 'react-router';
import sinon from 'sinon';

import * as Sagas from 'adminUsersV2/roles/sagas';
import * as Actions from 'adminUsersV2/roles/actions';
import * as GlobalActions from 'adminUsersV2/actions';
import CoreRolesApi from 'common/core-roles-api';

describe('roles/sagas', () => {
  describe('CHANGE_USER_ROLE', () => {
    it('handles success', () => {
      const userId = 'abcd-efgh';
      const newRole = 2;
      const response = { newRole: { name: 'wizard' }};
      const gen = Sagas.changeUserRole(Actions.changeUserRole(userId, newRole));
      expect(gen.next().value).to.eql(call(CoreRolesApi.assignRoleToUser, userId, newRole));
      expect(gen.next(response).value).to.eql(put(Actions.changeUserRoleSuccess(userId, newRole, 'wizard')));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedSuccessNotification('users.notifications.role_changed'))
      );
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure to change own role', () => {
      const userId = 'abcd-efgh';
      const newRole = 2;
      const error = new Error();
      const data = { message: 'Cannot change your own role' };
      error.status = 400;
      error.json = sinon.stub();
      error.json.returns(data);
      const gen = Sagas.changeUserRole(Actions.changeUserRole(userId, newRole));
      expect(gen.next().value).to.eql(call(CoreRolesApi.assignRoleToUser, userId, newRole));
      expect(gen.throw(error).value).to.eql(put(Actions.changeUserRoleFailure(userId, error)));
      expect(gen.next(data).value).to.eql(
        put(GlobalActions.showLocalizedErrorNotification('users.errors.own_role'))
      );
      expect(gen.next().done).to.eql(true);
    });
    it('handles other server failure', () => {
      const userId = 'abcd-efgh';
      const newRole = 2;
      const error = new Error();
      const data = { message: 'Other server failure' };
      error.status = 400;
      error.json = sinon.stub();
      error.json.returns(data);
      const gen = Sagas.changeUserRole(Actions.changeUserRole(userId, newRole));
      expect(gen.next().value).to.eql(call(CoreRolesApi.assignRoleToUser, userId, newRole));
      expect(gen.throw(error).value).to.eql(put(Actions.changeUserRoleFailure(userId, error)));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedErrorNotification('users.errors.unknown'))
      );
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('CHANGE_USER_ROLE_FILTER', () => {
    it('handles a specific roleId', () => {
      const roleId = 2;
      const gen = Sagas.changeUserRoleFilter(Actions.changeUserRoleFilter(roleId));
      expect(gen.next().value).to.eql(put(GlobalActions.gotoUserPage(1)));
      expect(gen.next().value).to.eql(call(browserHistory.getCurrentLocation));
      expect(gen.next({ query: {} }).value).to.eql(call(browserHistory.push, { query: { roleId } }));
      expect(gen.next().done).to.eql(true);
    });
    it('handles all roles', () => {
      const roleId = 'all';
      const gen = Sagas.changeUserRoleFilter(Actions.changeUserRoleFilter(roleId));
      expect(gen.next().value).to.eql(put(GlobalActions.gotoUserPage(1)));
      expect(gen.next().value).to.eql(call(browserHistory.getCurrentLocation));
      expect(gen.next({ query: {} }).value).to.eql(
        call(browserHistory.push, { query: { roleId: undefined } })
      );
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('LOAD_ROLES', () => {
    it('handles success', () => {
      const gen = Sagas.loadRoles();
      const roles = [{ id: 1 }];
      expect(gen.next().value).to.eql(call(CoreRolesApi.getAllRoles));
      expect(gen.next(roles).value).to.eql(put(Actions.loadRolesSuccess([{ id: '1' }])));
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const gen = Sagas.loadRoles();
      const error = new Error();
      expect(gen.next().value).to.eql(call(CoreRolesApi.getAllRoles));
      expect(gen.throw(error).value).to.eql(put(Actions.loadRolesFailure(error)));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('REMOVE_USER_ROLE', () => {
    it('handles success', () => {
      const userId = 'abcd-efgh';
      const roleId = 2;
      const gen = Sagas.removeUserRole(Actions.removeUserRole(userId, roleId));
      expect(gen.next().value).to.eql(call(CoreRolesApi.removeRoleFromUser, userId, roleId));
      expect(gen.next().value).to.eql(put(Actions.removeUserRoleSuccess(userId, roleId)));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedSuccessNotification('users.notifications.role_removed'))
      );
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure to remove own role', () => {
      const userId = 'abcd-efgh';
      const newRole = 2;
      const error = new Error();
      const data = { message: 'Cannot change your own role' };
      error.status = 400;
      error.json = sinon.stub();
      error.json.returns(data);
      const gen = Sagas.removeUserRole(Actions.removeUserRole(userId, newRole));
      expect(gen.next().value).to.eql(call(CoreRolesApi.removeRoleFromUser, userId, newRole));
      expect(gen.throw(error).value).to.eql(put(Actions.removeUserRoleFailure(userId, error)));
      expect(gen.next(data).value).to.eql(
        put(GlobalActions.showLocalizedErrorNotification('users.errors.own_role'))
      );
    });
    it('handles other server failure', () => {
      const userId = 'abcd-efgh';
      const newRole = 2;
      const error = new Error();
      const data = { message: 'Other server error' };
      error.status = 400;
      error.json = sinon.stub();
      error.json.returns(data);
      const gen = Sagas.removeUserRole(Actions.removeUserRole(userId, newRole));
      expect(gen.next().value).to.eql(call(CoreRolesApi.removeRoleFromUser, userId, newRole));
      expect(gen.throw(error).value).to.eql(put(Actions.removeUserRoleFailure(userId, error)));
      expect(gen.next(data).value).to.eql(
        put(GlobalActions.showLocalizedErrorNotification('users.errors.unknown'))
      );
    });
  });
});
