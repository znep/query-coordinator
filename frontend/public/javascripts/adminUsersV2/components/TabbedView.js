import React from 'react';
import PropTypes from 'prop-types';
import connectLocalization from 'common/i18n/components/connectLocalization';
import RoutingTab from './RoutingTab';
import { ConnectedInvitedUsersTable as InvitedUsers } from '../invitedUsers/components/InvitedUsersTable';
import { Router, Route, browserHistory } from 'react-router';
import { connect } from 'react-redux';
import Users from '../users/components/Users';
import AssetCounts from './AssetCounts';
import _ from 'lodash';
import { getInvitedUserCount, getLoadingData, getUsersResultCount } from '../reducers';

const mapStateToProps = state => ({
  invitedUserCount: getInvitedUserCount(state),
  userCount: getUsersResultCount(state),
  isLoading:  getLoadingData(state),
  invitedUsersAdminPath: _.get(state, 'config.routes.invitedUsersAdminPath'),
  usersAdminPath: _.get(state, 'config.routes.usersAdminPath')
});

const TabbedNav = (
  { I18n, children, invitedUserCount, isLoading, userCount, usersAdminPath, invitedUsersAdminPath }) => (
  <div>
    <div className="nav-bar">
      <div className="nav-tabs">
        <ul>
          <RoutingTab to={usersAdminPath}>{I18n.translate('users.navigation.users')}</RoutingTab>
          <RoutingTab to={invitedUsersAdminPath}>{I18n.translate('users.navigation.invited_users')}</RoutingTab>
        </ul>
      </div>
      <AssetCounts>
        <AssetCounts.Count
          isLoading={isLoading}
          name={I18n.translate('users.navigation.users')}
          count={userCount} />
        <AssetCounts.Count
          isLoading={isLoading}
          name={I18n.translate('users.navigation.invited_users')}
          count={invitedUserCount} />
      </AssetCounts>
    </div>
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

const TabbedView = ({ usersAdminPath, invitedUsersAdminPath }) => (
  <Router history={browserHistory}>
    <Route path="/admin" component={LocalizedTabbedNav}>
      <Route path={usersAdminPath} component={Users} />
      <Route path={invitedUsersAdminPath} component={InvitedUsers} />
    </Route>
  </Router>
);

TabbedView.propTypes = {
  invitedUsersAdminPath: PropTypes.string.isRequired,
  usersAdminPath: PropTypes.string.isRequired
};

export default connect(state => ({
  invitedUsersAdminPath: _.get(state, 'config.routes.invitedUsersAdminPath'),
  usersAdminPath: _.get(state, 'config.routes.usersAdminPath')
}))(connectLocalization(TabbedView));
