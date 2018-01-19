import sinon from 'sinon';
import { expect } from 'chai';

import * as Actions from 'adminUsersV2/users/actions';

describe('users/actions', () => {
  describe('creates an action to', () => {
    it('load users', () => {
      expect(Actions.loadUsers()).to.eql({ type: Actions.LOAD_USERS });
    });
    it('load users succeeded', () => {
      const users = ['result'];
      const resultCount = 1;
      expect(Actions.loadUsersSuccess(users, resultCount)).to.eql({
        type: Actions.LOAD_USERS_SUCCESS,
        payload: { users, resultCount }
      });
    });
    it('load users failed', () => {
      const error = new Error('error');
      expect(Actions.loadUsersFailure(error)).to.eql({
        type: Actions.LOAD_USERS_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('start a user search', () => {
      const query = 'query';
      expect(Actions.userSearch(query)).to.eql({
        type: Actions.USER_SEARCH,
        payload: { query }
      });
    });
    it('user search succeeded', () => {
      const users = ['users'];
      const resultCount = 1;
      expect(Actions.userSearchSuccess(users, resultCount)).to.eql({
        type: Actions.USER_SEARCH_SUCCESS,
        payload: { users, resultCount }
      });
    });
    it('user search failed', () => {
      const error = new Error('error');
      expect(Actions.userSearchFailure(error)).to.eql({
        type: Actions.USER_SEARCH_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('start autocomplete search', () => {
      const callback = sinon.spy();
      const query = 'socrata';
      expect(Actions.userAutocomplete(query, callback)).to.eql({
        type: Actions.USER_AUTOCOMPLETE,
        payload: {
          query,
          callback
        }
      });
    });
    it('clear add user form errors', () => {
      expect(Actions.clearAddUsersFormErrors()).to.eql({
        type: Actions.CLEAR_ADD_USERS_FORM_ERRORS
      });
    });
    it('set add user form errors', () => {
      const errors = ['my error'];
      expect(Actions.setAddUsersFormErrors(errors)).to.eql({
        type: Actions.SET_ADD_USERS_FORM_ERRORS,
        payload: { errors }
      });
    });
    it('show add users modal', () => {
      expect(Actions.showAddUsersModal()).to.eql({
        type: Actions.SHOW_ADD_USERS_MODAL
      });
    });
    it('hide add users modal', () => {
      expect(Actions.hideAddUsersModal()).to.eql({
        type: Actions.HIDE_ADD_USERS_MODAL
      });
    });
    it('disable add users modal', () => {
      expect(Actions.disableAddUsersModal()).to.eql({
        type: Actions.DISABLE_ADD_USERS_MODAL
      });
    });
    it('enable add users modal', () => {
      expect(Actions.enableAddUsersModal()).to.eql({
        type: Actions.ENABLE_ADD_USERS_MODAL
      });
    });
    it('cancel add users modal', () => {
      expect(Actions.cancelAddUsersModal()).to.eql({
        type: Actions.CANCEL_ADD_USERS_MODAL
      });
    });
    it('submit add users modal', () => {
      expect(Actions.submitAddUsersModal()).to.eql({
        type: Actions.SUBMIT_ADD_USERS_MODAL
      });
    });
    it('change add users form', () => {
      const emails = 'example1@example.com, example2@example.com';
      const roleId = '2';
      expect(Actions.changeAddUsersForm(emails, roleId)).to.eql({
        type: Actions.CHANGE_ADD_USERS_FORM,
        payload: { emails, roleId }
      });
    });
    it('clear add users form', () => {
      expect(Actions.clearAddUsersForm()).to.eql({
        type: Actions.CLEAR_ADD_USERS_FORM
      });
    });
    it('add users', () => {
      expect(Actions.addUsers()).to.eql({
        type: Actions.ADD_USERS
      });
    });
    it('add users success', () => {
      const invitedUsers = ['user'];
      expect(Actions.addUsersSuccess(invitedUsers)).to.eql({
        type: Actions.ADD_USERS_SUCCESS,
        payload: { invitedUsers }
      });
    });
    it('add users failure', () => {
      const errors = ['error'];
      expect(Actions.addUsersFailure(errors)).to.eql({
        type: Actions.ADD_USERS_FAILURE,
        error: true,
        payload: { errors }
      });
    });
    it('reset password', () => {
      const userId = 'abcd-efgh';
      expect(Actions.resetPassword(userId)).to.eql({
        type: Actions.RESET_PASSWORD,
        payload: { userId }
      });
    });
    it('goto user page', () => {
      const page = 1;
      expect(Actions.gotoUserPage(page)).to.eql({
        type: Actions.GOTO_USER_PAGE,
        payload: { page }
      });
    });
    it('sort user column', () => {
      const columnKey = 'screen_name';
      expect(Actions.sortUserColumn(columnKey)).to.eql({
        type: Actions.SORT_USER_COLUMN,
        payload: { columnKey }
      });
    });
  });
});
