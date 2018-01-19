import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import sinon from 'sinon';

import * as Sagas from 'adminUsersV2/users/sagas';
import * as Actions from 'adminUsersV2/users/actions';
import * as GlobalActions from 'adminUsersV2/actions';
import CoreFutureAccountsApi from 'common/core-future-accounts-api';
import UsersApi from 'common/users-api';

describe('users/sagas', () => {
  describe('addUsers', () => {
    it('successfully adds users', () => {
      const emails = 'example1@example.com,example2@example.com';
      const roleId = 2;
      const invitedUsers = ['new_user'];
      const gen = Sagas.addUsers();
      expect(gen.next().value).to.eql(put(Actions.showAddUsersModal()));
      expect(gen.next().value).to.eql(put(Actions.enableAddUsersModal()));
      gen.next(); // race
      expect(gen.next({ submit: Actions.submitAddUsersModal() }).value).to.eql(
        put(Actions.disableAddUsersModal())
      );
      gen.next(); // select form fields
      // validate form
      gen.next({ emails, roleId }); // delay
      expect(gen.next().value).to.eql(call(CoreFutureAccountsApi.postFutureUsers, emails, roleId));
      expect(gen.next().value).to.eql(call(CoreFutureAccountsApi.getFutureUsers));
      expect(gen.next(invitedUsers).value).to.eql(put(Actions.addUsersSuccess(invitedUsers)));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedSuccessNotification('users.notifications.add_user_success'))
      );
      expect(gen.next().value).to.eql(put(Actions.clearAddUsersForm()));
      expect(gen.next().value).to.eql(put(Actions.hideAddUsersModal()));
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure with adding users', () => {
      const emails = 'example1@example.com,example2@example.com';
      const roleId = 2;
      const gen = Sagas.addUsers();
      expect(gen.next().value).to.eql(put(Actions.showAddUsersModal()));
      expect(gen.next().value).to.eql(put(Actions.enableAddUsersModal()));
      gen.next(); // race
      expect(gen.next({ submit: Actions.submitAddUsersModal() }).value).to.eql(
        put(Actions.disableAddUsersModal())
      );
      gen.next(); // select from fields
      gen.next({ emails, roleId }); // delay
      expect(gen.next().value).to.eql(call(CoreFutureAccountsApi.postFutureUsers, emails, roleId));
      const errors = [{ translationKey: 'users.errors.server_error_html' }];
      expect(gen.throw(new Error()).value).to.eql(put(Actions.setAddUsersFormErrors(errors)));
      expect(gen.next().value).to.eql(put(Actions.addUsersFailure(errors)));
      expect(gen.next().value).to.eql(put(Actions.enableAddUsersModal()));
    });
    it('handles canceling adding users', () => {
      const gen = Sagas.addUsers();
      expect(gen.next().value).to.eql(put(Actions.showAddUsersModal()));
      expect(gen.next().value).to.eql(put(Actions.enableAddUsersModal()));
      gen.next(); // race
      expect(gen.next({ cancel: Actions.cancelAddUsersModal() }).value).to.eql(
        put(Actions.clearAddUsersForm())
      );
      expect(gen.next().value).to.eql(put(Actions.hideAddUsersModal()));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('gotoPage', () => {
    it('triggers a new user search', () => {
      const gen = Sagas.gotoPage();
      expect(gen.next().value).to.eql(put(Actions.userSearch()));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('loadUsers', () => {
    it('loads users successfully', () => {
      const gen = Sagas.loadUsers();
      const options = {};
      const domain = 'localhost';
      const users = ['user'];
      const resultCount = 1;
      gen.next(); // select options
      gen.next(options); // select domain
      expect(gen.next(domain).value).to.eql(call(UsersApi.getUsers, domain, options));
      expect(gen.next({ users, resultCount }).value).to.eql(
        put(Actions.loadUsersSuccess(users, resultCount))
      );
      expect(gen.next().done).to.eql(true);
    });
    it('fails loading users', () => {
      const gen = Sagas.loadUsers();
      const options = {};
      const domain = 'localhost';
      gen.next(); // select options
      gen.next(options);
      expect(gen.next(domain).value).to.eql(call(UsersApi.getUsers, domain, options));
      const error = new Error();
      expect(gen.throw(error).value).to.eql(put(Actions.loadUsersFailure(error)));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('resetPassword', () => {
    it('resets the password', () => {
      const userId = 'abcd-efgh';
      const gen = Sagas.resetPassword({ payload: { userId } });
      expect(gen.next().value).to.eql(call(UsersApi.resetPassword, userId));
      expect(gen.next({ success: true }).value).to.eql(
        put(GlobalActions.showLocalizedSuccessNotification('users.notifications.password_reset'))
      );
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('sortColumn', () => {
    it('triggers a new user search', () => {
      const gen = Sagas.sortColumn();
      expect(gen.next().value).to.eql(put(Actions.userSearch()));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('userAutocomplete', () => {
    const query = 'query';
    const callback = sinon.spy();
    const domain = 'localhost';
    const results = ['results'];
    it('triggers an autocomplete search when there is a query', () => {
      const gen = Sagas.userAutocomplete({ payload: { query, callback } });
      gen.next(); // select domain
      expect(gen.next(domain).value).to.eql(call(UsersApi.autocomplete, domain, query));
      expect(gen.next(results).value).to.eql(call(callback, results));
      expect(gen.next().done).to.eql(true);
    });
    it('does not trigger an autocomplete search when there is no query', () => {
      const gen = Sagas.userAutocomplete({ payload: { query: '', callback } });
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('userSearch', () => {
    const options = {};
    const domain = 'localhost';
    const users = ['user'];
    const resultCount = 1;
    const error = new Error();
    it('performs a user search', () => {
      const gen = Sagas.userSearch();
      gen.next(); // select options
      gen.next(options); // select domain;
      expect(gen.next(domain).value).to.eql(call(UsersApi.getUsers, domain, options));
      expect(gen.next({ users, resultCount }).value).to.eql(
        put(Actions.userSearchSuccess(users, resultCount))
      );
      expect(gen.next().done).to.eql(true);
    });
    it('handles user search error', () => {
      const gen = Sagas.userSearch();
      gen.next(); // select options
      gen.next(options); // select domain
      expect(gen.next(domain).value).to.eql(call(UsersApi.getUsers, domain, options));
      expect(gen.throw(error).value).to.eql(put(Actions.userSearchFailure(error)));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('validateUserForm', () => {
    const emails = 'example1@example.com,example2@example.com';
    const roleId = 2;
    it('validates the form data properly', () => {
      expect(Sagas.validateUserForm(emails, roleId)).to.eql({ emails, roleId });
      expect(() => Sagas.validateUserForm('', roleId)).to.throw();
      expect(() => Sagas.validateUserForm('bogus', roleId)).to.throw();
      expect(() => Sagas.validateUserForm(emails, '')).to.throw();
    });
  });
});
