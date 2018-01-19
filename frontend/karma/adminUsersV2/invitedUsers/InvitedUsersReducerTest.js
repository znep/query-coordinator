import { expect } from 'chai';

import * as Actions from 'adminUsersV2/invitedUsers/actions';
import reducer, { initialState } from 'adminUsersV2/invitedUsers/reducers';

describe('invitedUsers/reducers', () => {
  it('reduces initial state', () => {
    expect(reducer(undefined, {})).to.eql(initialState);
  });
  it('handles LOAD_INVITED_USERS_SUCCESS', () => {
    const invitedUsers = ['user'];
    expect(reducer({ loadingData: true }, Actions.loadInvitedUsersSuccess(invitedUsers))).to.eql({
      loadingData: false,
      invitedUsers
    });
  });
  it('handles REMOVE_INVITED_USER', () => {
    const id = 1;
    const invitedUsers = [{ id: 1 }];
    expect(reducer({ invitedUsers }, Actions.removeInvitedUser(id))).to.eql({
      invitedUsers: [{ id: 1, isRemoving: true }]
    });
  });
  it('handles REMOVE_INVITED_USER_SUCCESS', () => {
    const id = 1;
    const invitedUsers = [{ id: 1, isRemoving: true }];
    expect(reducer({ invitedUsers }, Actions.removeInvitedUserSuccess(id))).to.eql({
      invitedUsers: []
    });
  });
  it('handles REMOVE_INVITED_USER_FAILURE', () => {
    const id = 1;
    const invitedUsers = [{ id: 1, isRemoving: true }];
    expect(reducer({ invitedUsers }, Actions.removeInvitedUserFailure(id))).to.eql({
      invitedUsers: [{ id: 1 }]
    });
  });
});
