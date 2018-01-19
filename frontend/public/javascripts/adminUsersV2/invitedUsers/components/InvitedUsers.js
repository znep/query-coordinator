import React from 'react';
import InvitedUsersTable from './InvitedUsersTable';
import AddUserButton from '../../users/components/AddUserButton';

const InvitedUsers = () => (
  <div>
    <div className="user-search-bar search-bar">
      <div/>
      <AddUserButton />
    </div>
    <InvitedUsersTable />
  </div>
);

export default InvitedUsers;
