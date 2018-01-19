import { expect } from 'chai';

import * as Actions from 'adminUsersV2/roles/actions';
import reducer, { initialState } from 'adminUsersV2/roles/reducers';

describe('roles/reducers', () => {
  it('reduces initial state', () => {
    expect(reducer(undefined, {})).to.eql(initialState);
  });

  it('handles LOAD_ROLES_SUCCESS', () => {
    expect(reducer(initialState, Actions.loadRolesSuccess(['one', 'two']))).to.eql({
      loadingData: false,
      roles: ['one', 'two'],
      userRoleFilter: undefined
    });
  });

  it('handles LOAD_ROLES_FAILURE', () => {
    expect(reducer(initialState, Actions.loadRolesFailure())).to.eql({
      loadingData: false,
      roles: [],
      userRoleFilter: undefined
    });
  });

  it('handles CHANGE_USER_ROLE_FILTER with a specific role', () => {
    const roleId = 2;
    expect(reducer({ userRoleFilter: 1 }, Actions.changeUserRoleFilter(roleId))).to.eql({
      userRoleFilter: 2
    });
  });
  it('handles CHANGE_USER_ROLE_FILTER with the "all" role', () => {
    const roleId = 'all';
    expect(reducer({ userRoleFilter: 1 }, Actions.changeUserRoleFilter(roleId))).to.eql({
      userRoleFilter: undefined
    });
  });
});
