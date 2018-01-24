import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';

import * as Sagas from 'adminUsersV2/invitedUsers/sagas';
import * as Actions from 'adminUsersV2/invitedUsers/actions';
import * as GlobalActions from 'adminUsersV2/actions';
import CoreFutureAccountsApi from 'common/core-future-accounts-api';

describe('invitedUsers/sagas', () => {
  describe('loadInvitedUsers', () => {
    it('handles success', () => {
      const gen = Sagas.loadInvitedUsers();
      const invitedUsers = [{ createdAt: 1234, email: 'example@example.com', id: 123 }];
      expect(gen.next().value).to.eql(call(CoreFutureAccountsApi.getFutureUsers));
      expect(gen.next(invitedUsers).value).to.eql(put(Actions.loadInvitedUsersSuccess(invitedUsers)));
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const gen = Sagas.loadInvitedUsers();
      const error = new Error();
      gen.next(); // api call
      expect(gen.throw(error).value).to.eql(put(Actions.loadInvitedUsersFailure(error)));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('removeInvitedUser', () => {
    it('handles success', () => {
      const email = 'example@example.com';
      const id = 1;
      const gen = Sagas.removeInvitedUser(Actions.removeInvitedUser(id));
      gen.next(); // select email
      expect(gen.next(email).value).to.eql(call(CoreFutureAccountsApi.removeFutureUser, id));
      expect(gen.next().value).to.eql(put(Actions.removeInvitedUserSuccess(id)));
      expect(gen.next().value).to.eql(
        put(
          GlobalActions.showLocalizedSuccessNotification('users.notifications.remove_invited_user_success', {
            email
          })
        )
      );
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const id = 1;
      const error = new Error();
      const gen = Sagas.removeInvitedUser(Actions.removeInvitedUser(id));
      gen.next(); // select email
      gen.next(); // api call
      expect(gen.throw(error).value).to.eql(put(Actions.removeInvitedUserFailure(id, error)));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedErrorNotification('users.errors.server_error_html'))
      );
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('resendInvitedUserEmail', () => {
    it('handles success', () => {
      const email = 'example@example.com';
      const gen = Sagas.resendInvitedUserEmail(Actions.resendInvitedUserEmail(email));
      expect(gen.next().value).to.eql(call(CoreFutureAccountsApi.resendFutureUserEmail, email));
      expect(gen.next().value).to.eql(put(Actions.resendInvitedUserEmailSuccess()));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedSuccessNotification('users.notifications.resent_email_success'))
      );
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const email = 'example@example.com';
      const gen = Sagas.resendInvitedUserEmail(Actions.resendInvitedUserEmail(email));
      const error = new Error();
      gen.next();
      expect(gen.throw(error).value).to.eql(put(Actions.resendInvitedUserEmailFailure(error)));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedErrorNotification('users.errors.server_error_html'))
      );
      expect(gen.next().done).to.eql(true);
    });
  });
});
