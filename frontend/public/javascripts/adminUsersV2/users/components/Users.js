import React from 'react';
import UsersTable from './UsersTable';
import UserSearchBar from './UserSearchBar';

const Users = () => {
  return (
    <div>
      <UserSearchBar/>
      <UsersTable/>
    </div>
  );
};

export default Users;
