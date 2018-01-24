import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Router, Route, browserHistory } from 'react-router';
import { connect as fullConnect } from '../utils';
import InvitedUsers from '../invitedUsers/components/InvitedUsers';
import Users from '../users/components/Users';
import TabbedNav from './TabbedNav';
import * as Selectors from '../selectors';

import * as invitedUsersActions from '../invitedUsers/actions';
import * as rolesActions from '../roles/actions';
import * as usersActions from '../users/actions';

class TabbedView extends Component {
  static propTypes = {
    invitedUsersAdminPath: PropTypes.string.isRequired,
    usersAdminPath: PropTypes.string.isRequired
  };

  componentDidMount() {
    this.props.loadInvitedUsers();
    this.props.loadUsers();
  }

  render() {
    const { invitedUsersAdminPath, usersAdminPath } = this.props;
    return (
      <Router history={browserHistory}>
        <Route path="/admin" component={TabbedNav}>
          <Route path={usersAdminPath} component={Users} />
          <Route path={invitedUsersAdminPath} component={InvitedUsers} />
        </Route>
      </Router>
    );
  }
}

const mapDispatchToProps = {
  loadInvitedUsers: invitedUsersActions.loadInvitedUsers,
  loadRoles: rolesActions.loadRoles,
  loadUsers: usersActions.loadUsers
};

export default fullConnect(
  state => ({
    invitedUsersAdminPath: Selectors.getInvitedUsersAdminPath(state),
    usersAdminPath: Selectors.getUsersAdminPath(state)
  }),
  mapDispatchToProps
)(TabbedView);
