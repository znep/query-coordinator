import React from 'react';
import PropTypes from 'prop-types';
import connectLocalization from 'common/i18n/components/connectLocalization';
import RoutingTab from './RoutingTab';
import { ConnectedUsersTable } from './UsersTable';
import UserSearchBar from './UserSearchBar';
import { ConnectedInvitedUsersTable as InvitedUsers } from './InvitedUsersTable';
import { Router, Route, browserHistory } from 'react-router';
import { connect } from 'react-redux';
import _ from 'lodash';

const mapStateToProps = state => ({
  usersAdminPath: _.get(state, 'config.routes.usersAdminPath'),
  invitedUsersAdminPath: _.get(state, 'config.routes.invitedUsersAdminPath')
});

const TabbedNav = ({ I18n, children, usersAdminPath, invitedUsersAdminPath }) => (
  <div>
    <ul className="nav-tabs">
      <RoutingTab to={usersAdminPath}>{I18n.translate('users.navigation.users')}</RoutingTab>
      <RoutingTab to={invitedUsersAdminPath}>{I18n.translate('users.navigation.invited_users')}</RoutingTab>
    </ul>
    {children}
  </div>
);

TabbedNav.propTypes = {
  children: PropTypes.any.isRequired,
  invitedUsersAdminPath: PropTypes.string.isRequired,
  usersAdminPath: PropTypes.string.isRequired,
  I18n: PropTypes.object.isRequired
};

const LocalizedTabbedNav = connect(mapStateToProps)(connectLocalization(TabbedNav));

const Users = () => (
  <div>
    <UserSearchBar />
    <ConnectedUsersTable />
  </div>
);


const TabbedView = ({ usersAdminPath, invitedUsersAdminPath }) => (
  <Router history={ browserHistory }>
    <Route path="/admin" component={ LocalizedTabbedNav }>
      <Route path={usersAdminPath} component={ Users }/>
      <Route path={invitedUsersAdminPath} component={ InvitedUsers }/>
    </Route>
  </Router>
);

TabbedView.propTypes = {
  invitedUsersAdminPath: PropTypes.string.isRequired,
  usersAdminPath: PropTypes.string.isRequired
};

export default connect(mapStateToProps)(connectLocalization(TabbedView));