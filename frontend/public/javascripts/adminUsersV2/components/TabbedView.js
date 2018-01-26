import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Router, Route, Redirect, browserHistory } from 'react-router';
import { connect as fullConnect } from '../utils';
import InvitedUsers from '../invitedUsers/components/InvitedUsers';
import Teams from '../teams/components/Teams';
import Users from '../users/components/Users';
import TabbedNav from './TabbedNav';
import * as Selectors from '../selectors';

import TeamView from '../teams/components/TeamView';
import * as teamActions from '../teams/actions';
import * as invitedUsersActions from '../invitedUsers/actions';
import * as rolesActions from '../roles/actions';
import * as usersActions from '../users/actions';

class TabbedView extends Component {
  static propTypes = {
    enableTeams: PropTypes.bool,
    invitedUsersAdminPath: PropTypes.string.isRequired,
    teamsAdminPath: PropTypes.string.isRequired,
    usersAdminPath: PropTypes.string.isRequired
  };

  componentDidMount() {
    const { enableTeams } = this.props;
    enableTeams && this.props.loadTeamRoles();
    this.props.loadInvitedUsers();
    this.props.loadUsers();
    enableTeams && this.props.loadTeams();
  }

  render() {
    const { enableTeams, invitedUsersAdminPath, teamsAdminPath, usersAdminPath } = this.props;
    return (
      <Router history={browserHistory}>
        <Route path="/admin" component={TabbedNav}>
          <Route path={usersAdminPath} component={Users} />
          <Route path={invitedUsersAdminPath} component={InvitedUsers} />
          {enableTeams && <Route path={teamsAdminPath} component={Teams} />}
          {enableTeams && <Route path={`${teamsAdminPath}/:teamId`} component={TeamView} />}
          <Redirect from='*' to={usersAdminPath} />
        </Route>
      </Router>
    );
  }
}

const mapDispatchToProps = {
  loadInvitedUsers: invitedUsersActions.loadInvitedUsers,
  loadRoles: rolesActions.loadRoles,
  loadTeamRoles: teamActions.loadTeamRoles,
  loadTeams: teamActions.loadTeams,
  loadUsers: usersActions.loadUsers
};

const mapStateToProps = state => ({
  enableTeams: Selectors.getEnableTeams(state),
  invitedUsersAdminPath: Selectors.getInvitedUsersAdminPath(state),
  teamsAdminPath: Selectors.getTeamsAdminPath(state),
  usersAdminPath: Selectors.getUsersAdminPath(state)
});

export default fullConnect(mapStateToProps, mapDispatchToProps)(TabbedView);
