import { expect } from 'chai';

import * as Actions from 'adminUsersV2/invitedUsers/actions';

describe('invitedUsers/actions', () => {
  describe('creates an action to', () => {
    it('load invited users', () => {
      expect(Actions.loadInvitedUsers()).to.eql({
        type: Actions.LOAD_INVITED_USERS
      });
    });
    it('load invited users success', () => {
      const invitedUsers = ['users'];
      expect(Actions.loadInvitedUsersSuccess(invitedUsers)).to.eql({
        type: Actions.LOAD_INVITED_USERS_SUCCESS,
        payload: { invitedUsers }
      });
    });
    it('load invited users failure', () => {
      const error = new Error();
      expect(Actions.loadInvitedUsersFailure(error)).to.eql({
        type: Actions.LOAD_INVITED_USERS_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('remove invited user', () => {
      const id = 1;
      expect(Actions.removeInvitedUser(id)).to.eql({
        type: Actions.REMOVE_INVITED_USER,
        payload: { id }
      });
    });
    it('remove invited user success', () => {
      const id = 1;
      expect(Actions.removeInvitedUserSuccess(id)).to.eql({
        type: Actions.REMOVE_INVITED_USER_SUCCESS,
        payload: { id }
      });
    });
    it('remove invited user failure', () => {
      const id = 1;
      const error = new Error();
      expect(Actions.removeInvitedUserFailure(id, error)).to.eql({
        type: Actions.REMOVE_INVITED_USER_FAILURE,
        error: true,
        payload: { id, error }
      });
    });
    it('resend invited user email', () => {
      const email = 'example@example.com';
      expect(Actions.resendInvitedUserEmail(email)).to.eql({
        type: Actions.RESEND_INVITED_USER_EMAIL,
        payload: { email }
      });
    });
    it('resend invited user email success', () => {
      expect(Actions.resendInvitedUserEmailSuccess()).to.eql({
        type: Actions.RESEND_INVITED_USER_EMAIL_SUCCESS
      });
    });
    it('resend invited user email failure', () => {
      const error = new Error();
      expect(Actions.resendInvitedUserEmailFailure(error)).to.eql({
        type: Actions.RESEND_INVITED_USER_EMAIL_FAILURE,
        error: true,
        payload: { error }
      });
    });
  });
});
