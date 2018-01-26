import React from 'react';
import PropTypes from 'prop-types';
import RoutingTab from './RoutingTab';
import { connect as fullConnect, I18nPropType } from '../utils';
import Counts from './Counts';
import * as Selectors from '../selectors';
import RolesLoader from '../roles/components/RolesLoader';
import startsWith from 'lodash/fp/startsWith';

const TabbedNav = props => {
  const { I18n, children, invitedUsersAdminPath, usersAdminPath } = props;
  const {  enableTeams } = props;
  return (
    <div>
      <RolesLoader />
      <div className="nav-bar">
        <div className="nav-tabs">
          <ul>
            <RoutingTab to={usersAdminPath}>{I18n.t('users.navigation.users')}</RoutingTab>
            <RoutingTab to={invitedUsersAdminPath}>{I18n.t('users.navigation.invited_users')}</RoutingTab>
            {enableTeams && (
              <RoutingTab computeIsCurrent={startsWith} to={props.teamsAdminPath}>
                {I18n.t('users.navigation.teams')}
              </RoutingTab>
            )}
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
  enableTeams: PropTypes.bool.isRequired,
  invitedUsersAdminPath: PropTypes.string.isRequired,
  teamsAdminPath: PropTypes.string.isRequired,
  usersAdminPath: PropTypes.string.isRequired,
  I18n: I18nPropType.isRequired
};

const mapStateToProps = state => ({
  enableTeams: Selectors.getEnableTeams(state),
  invitedUsersAdminPath: Selectors.getInvitedUsersAdminPath(state),
  teamsAdminPath: Selectors.getTeamsAdminPath(state),
  usersAdminPath: Selectors.getUsersAdminPath(state)
});

export default fullConnect(mapStateToProps)(TabbedNav);
