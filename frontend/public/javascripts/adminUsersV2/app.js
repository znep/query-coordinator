import React from 'react';
import { connect } from 'react-redux';
import { ConnectedUsersTable } from './components/users_table';

export const App = () => {
  return (
    <div className="admin-users-app" >
      <ConnectedUsersTable />
    </div>
  );
};

export default connect()(App);
