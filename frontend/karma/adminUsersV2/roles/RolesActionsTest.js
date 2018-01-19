import { expect } from 'chai';

import * as Actions from 'adminUsersV2/roles/actions';

describe('roles/actions', () => {
  describe('creates an action to', () => {
    it('change user role', () => {
      const userId = 'abcd-efgh';
      const newRole = 2;
      expect(Actions.changeUserRole(userId, newRole)).to.eql({
        type: Actions.CHANGE_USER_ROLE,
        payload: { userId, newRole }
      });
    });
    it('change user role success', () => {
      const userId = 'abcd-efgh';
      const newRole = 2;
      const newRoleName = 'wizard';
      expect(Actions.changeUserRoleSuccess(userId, newRole, newRoleName)).to.eql({
        type: Actions.CHANGE_USER_ROLE_SUCCESS,
        payload: { userId, newRole, newRoleName }
      });
    });
    it('change user role failure', () => {
      const userId = 'abcd-efgh';
      const error = new Error();
      expect(Actions.changeUserRoleFailure(userId, error)).to.eql({
        type: Actions.CHANGE_USER_ROLE_FAILURE,
        error: true,
        payload: { userId, error }
      });
    });
    it('load roles', () => {
      expect(Actions.loadRoles()).to.eql({
        type: Actions.LOAD_ROLES
      });
    });
    it('load roles success', () => {
      const roles = ['role'];
      expect(Actions.loadRolesSuccess(roles)).to.eql({
        type: Actions.LOAD_ROLES_SUCCESS,
        payload: { roles }
      });
    });
    it('load roles failure', () => {
      const error = new Error();
      expect(Actions.loadRolesFailure(error)).to.eql({
        type: Actions.LOAD_ROLES_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('remove user role', () => {
      const userId = 'abcd-efgh';
      const roleId = 2;
      expect(Actions.removeUserRole(userId, roleId)).to.eql({
        type: Actions.REMOVE_USER_ROLE,
        payload: { userId, roleId }
      });
    });
    it('remove user role success', () => {
      const userId = 'abcd-efgh';
      const formerRoleId = 2;
      expect(Actions.removeUserRoleSuccess(userId, formerRoleId)).to.eql({
        type: Actions.REMOVE_USER_ROLE_SUCCESS,
        payload: { userId, formerRoleId }
      });
    });
    it('remove user role failure', () => {
      const userId = 'abcd-efgh';
      const error = new Error();
      expect(Actions.removeUserRoleFailure(userId, error)).to.eql({
        type: Actions.REMOVE_USER_ROLE_FAILURE,
        error: true,
        payload: { userId, error }
      });
    });
    it('change user role filter', () => {
      const roleId = 2;
      expect(Actions.changeUserRoleFilter(roleId)).to.eql({
        type: Actions.CHANGE_USER_ROLE_FILTER,
        payload: { roleId }
      });
    });
  });
});
