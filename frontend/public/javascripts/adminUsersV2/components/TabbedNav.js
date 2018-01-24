import React from 'react';
import PropTypes from 'prop-types';
import RoutingTab from './RoutingTab';
import { connect as fullConnect } from '../utils';
import Counts from './Counts';
import * as Selectors from '../selectors';
import RolesLoader from '../roles/components/RolesLoader';

const TabbedNav = props => {
  const { I18n, children, invitedUsersAdminPath, usersAdminPath } = props;
  return (
    <div>
      <RolesLoader />
      <div className="nav-bar">
        <div className="nav-tabs">
          <ul>
            <RoutingTab to={usersAdminPath}>{I18n.t('users.navigation.users')}</RoutingTab>
            <RoutingTab to={invitedUsersAdminPath}>{I18n.t('users.navigation.invited_users')}</RoutingTab>
          </ul>
        </div>
        <Counts {...props} />
      </div>
      {children}
    </div>
  );
};

TabbedNav.propTypes = {
  children: PropTypes.any.isRequired,
  invitedUsersAdminPath: PropTypes.string.isRequired,
  usersAdminPath: PropTypes.string.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  invitedUsersAdminPath: Selectors.getInvitedUsersAdminPath(state),
  usersAdminPath: Selectors.getUsersAdminPath(state)
});

export default fullConnect(mapStateToProps)(TabbedNav);
