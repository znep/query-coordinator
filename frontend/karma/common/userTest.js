import { expect, assert } from 'chai';
import {
  isUserRoled,
  isUserAdminOrPublisher,
  isUserSuperadmin
} from 'user';

describe('user', () => {
  describe('isUserRoled', () => {
    afterEach(() => {
      delete window.serverConfig.currentUser;
    });

    it('returns true if the user has a role name', () => {
      window.serverConfig.currentUser = { roleName: 'anything' };
      assert.isTrue(isUserRoled());
    });

    it('returns true if the user is a superadmin', () => {
      window.serverConfig.currentUser = { flags: ['admin'] };
      assert.isTrue(isUserRoled());
    });

    it('returns false if the user has no rolename', () => {
      window.serverConfig.currentUser = {};
      assert.isFalse(isUserRoled());
    });

    it('returns false if no user exists', () => {
      assert.isFalse(isUserRoled());
    });
  });

  describe('isUserAdminOrPublisher', () => {
    afterEach(() => {
      delete window.serverConfig.currentUser;
    });

    it('returns true if the user has an administrator role', () => {
      window.serverConfig.currentUser = { roleName: 'administrator' };
      assert.isTrue(isUserAdminOrPublisher());
    });

    it('returns true if the user has a publisher role', () => {
      window.serverConfig.currentUser = { roleName: 'publisher' };
      assert.isTrue(isUserAdminOrPublisher());
    });

    it('returns true if the user is a superadmin', () => {
      window.serverConfig.currentUser = { flags: ['admin'] };
      assert.isTrue(isUserAdminOrPublisher());
    });

    it('returns false if the user role that is not administrator or publisher', () => {
      window.serverConfig.currentUser = { roleName: 'something' };
      assert.isFalse(isUserAdminOrPublisher());
    });

    it('returns false if no user exists', () => {
      assert.isFalse(isUserAdminOrPublisher());
    });
  });

  describe('isUserSuperadmin', () => {
    afterEach(() => {
      delete window.serverConfig.currentUser;
    });

    it('returns true if the user is a superadmin', () => {
      window.serverConfig.currentUser = { flags: ['admin'] };
      assert.isTrue(isUserSuperadmin());
    });

    it('returns false if the user is not a superadmin', () => {
      window.serverConfig.currentUser = { roleName: 'administrator' };
      assert.isFalse(isUserSuperadmin());
    });

    it('returns false if no user exists', () => {
      assert.isFalse(isUserSuperadmin());
    });
  });
});
