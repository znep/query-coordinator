import { expect } from 'chai';

import * as Actions from 'adminUsersV2/users/actions';
import * as RolesActions from 'adminUsersV2/roles/actions';
import reducer, { initialState } from 'adminUsersV2/users/reducers';

describe('users/reducers', () => {
  it('reduces initial state', () => {
    expect(reducer(undefined, {})).to.eql(initialState);
  });
  it('handles LOAD_USERS', () => {
    expect(reducer({ loadingData: false }, Actions.loadUsers())).to.eql({ loadingData: true });
  });
  it('handles LOAD_USERS_SUCCESS', () => {
    const users = ['user'];
    const resultCount = 1;
    expect(reducer({ loadingData: true }, Actions.loadUsersSuccess(users, resultCount))).to.eql({
      loadingData: false,
      users,
      resultCount
    });
  });
  it('handles LOAD_USERS_FAILURE', () => {
    const error = new Error();
    expect(reducer({ loadingData: true }, Actions.loadUsersFailure(error))).to.eql({
      loadingData: false
    });
  });
  it('handles USER_SEARCH', () => {
    const query = 'socrata';
    expect(reducer({ loadingData: false }, Actions.userSearch(query))).to.eql({
      loadingData: true
    });
  });
  it('handles USER_SEARCH_SUCCESS', () => {
    const searchResults = ['user'];
    const searchResultCount = 1;
    expect(
      reducer({ loadingData: true }, Actions.userSearchSuccess(searchResults, searchResultCount))
    ).to.eql({
      loadingData: false,
      searchResultCount,
      users: searchResults
    });
  });
  it('handles USER_SEARCH_FAILURE', () => {
    const error = new Error();
    expect(reducer({ loadingData: true }, Actions.userSearchFailure(error))).to.eql({
      loadingData: false,
      searchResultCount: undefined,
      users: []
    });
  });
  it('handles CHANGE_ADD_USERS_FORM', () => {
    const emails = 'example@example.com';
    const roleId = 2;
    expect(reducer({}, Actions.changeAddUsersForm(emails, roleId))).to.eql({
      addUsersForm: { emails, roleId, errors: [] }
    });
  });
  it('handles SET_ADD_USERS_FORM_ERRORS', () => {
    const errors = ['error'];
    expect(reducer({}, Actions.setAddUsersFormErrors(errors))).to.eql({
      addUsersForm: { errors }
    });
  });
  it('handles CLEAR_ADD_USERS_FORM', () => {
    expect(reducer({}, Actions.clearAddUsersForm())).to.eql({
      addUsersForm: { emails: '', roleId: null, errors: [] }
    });
  });
  it('handles GOTO_USER_PAGE', () => {
    expect(reducer({}, Actions.gotoUserPage(2))).to.eql({
      zeroBasedPage: 1
    });
  });
  it('handles SORT_USER_COLUMN', () => {
    const orderBy = 'screen_name';
    expect(reducer({}, Actions.sortUserColumn(orderBy))).to.eql({
      orderBy,
      sortDirection: 'ASC'
    });
  });
  it('handles CHANGE_USER_ROLE', () => {
    const userId = 'abcd-efgh';
    const newRole = 2;
    expect(
      reducer({ users: [{ id: 'abcd-efgh' }, { id: '1' }] }, RolesActions.changeUserRole(userId, newRole))
    ).to.eql({
      users: [
        {
          id: 'abcd-efgh',
          pendingRole: 2
        },
        {
          id: '1'
        }
      ]
    });
  });
  it('handles CHANGE_USER_ROLE_SUCCESS', () => {
    const userId = 'abcd-efgh';
    const newRole = 2;
    const newRoleName = 'wizard';
    expect(
      reducer(
        { users: [{ id: 'abcd-efgh', pendingRole: 2 }, { id: '1' }] },
        RolesActions.changeUserRoleSuccess(userId, newRole, newRoleName)
      )
    ).to.eql({
      users: [
        {
          id: 'abcd-efgh',
          pendingRole: undefined,
          roleId: 2,
          roleName: 'wizard'
        },
        {
          id: '1'
        }
      ]
    });
  });
  it('handles CHANGE_USER_ROLE_FAILURE', () => {
    const userId = 'abcd-efgh';
    const error = new Error();
    expect(
      reducer(
        { users: [{ id: 'abcd-efgh', pendingRole: 2 }, { id: '1' }] },
        RolesActions.changeUserRoleFailure(userId, error)
      )
    ).to.eql({
      users: [
        {
          id: 'abcd-efgh',
          pendingRole: undefined
        },
        {
          id: '1'
        }
      ]
    });
  });
  it('handles REMOVE_USER_ROLE', () => {
    const userId = 'abcd-efgh';
    expect(
      reducer({ users: [{ id: 'abcd-efgh' }, { id: '1' }] }, RolesActions.removeUserRole(userId))
    ).to.eql({
      users: [
        {
          id: 'abcd-efgh',
          removingRole: true
        },
        {
          id: '1'
        }
      ]
    });
  });
  it('handles REMOVE_USER_ROLE_SUCCESS', () => {
    const userId = 'abcd-efgh';
    expect(
      reducer({ users: [{ id: 'abcd-efgh' }, { id: '1' }] }, RolesActions.removeUserRoleSuccess(userId))
    ).to.eql({
      users: [
        {
          id: '1'
        }
      ]
    });
  });
  it('handles REMOVE_USER_ROLE_FAILURE', () => {
    const userId = 'abcd-efgh';
    const error = new Error();
    expect(
      reducer(
        { users: [{ id: 'abcd-efgh', removingRole: true }, { id: '1' }] },
        RolesActions.removeUserRoleFailure(userId, error)
      )
    ).to.eql({
      users: [
        {
          id: 'abcd-efgh',
          removingRole: undefined
        },
        {
          id: '1'
        }
      ]
    });
  });
});
