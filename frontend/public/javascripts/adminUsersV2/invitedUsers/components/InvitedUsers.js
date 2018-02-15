import React from 'react';
import InvitedUsersTable from './InvitedUsersTable';
import AddUserButton from '../../users/components/AddUserButton';
import UserFilter from '../../users/components/UserFilter';

const InvitedUsers = () => (
  <div>
    <div className="user-search-bar search-bar">
      <div className="invited-users-search-bar-spacer"/>
      <UserFilter />
      <AddUserButton />
    </div>
    <InvitedUsersTable />
  </div>
);

export default InvitedUsers;
