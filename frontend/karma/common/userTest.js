import { expect, assert } from 'chai';
import {
  isUserRoled,
  userHasRight,
  isUserSuperadmin
} from 'user';
import {
  create_datasets,
  edit_others_datasets
} from 'rights';

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

  describe('userHasRight', () => {
    afterEach(() => {
      delete window.serverConfig.currentUser;
    });

    it('returns true if the user has the given right', () => {
      window.serverConfig.currentUser = { rights: [ 'create_datasets', 'edit_others_datasets' ]};
      assert.isTrue(userHasRight(create_datasets));
      assert.isTrue(userHasRight(edit_others_datasets));
    });

    it('returns false if the user does not have the given right', () => {
      window.serverConfig.currentUser = { rights: [ 'not_a_right' ]};
      assert.isFalse(userHasRight(create_datasets));
      assert.isFalse(userHasRight(edit_others_datasets));
    });

    it('returns true if the user is a superadmin', () => {
      window.serverConfig.currentUser = { flags: ['admin'] };
      assert.isTrue(userHasRight(create_datasets));
      assert.isTrue(userHasRight(edit_others_datasets));
    });

    it('returns false if no user exists', () => {
      assert.isFalse(userHasRight(create_datasets));
      assert.isFalse(userHasRight(edit_others_datasets));
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
