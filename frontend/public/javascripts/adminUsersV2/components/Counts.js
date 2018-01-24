import React from 'react';
import PropTypes from 'prop-types';
import { connect as fullConnect, I18nPropType } from '../utils';
import AssetCounts from './AssetCounts';
import * as Selectors from '../selectors';

export const Counts = ({
  I18n,
  enableTeams,
  invitedUserCount,
  invitedUsersLoading,
  teamsCount,
  teamsLoading,
  userCount,
  usersLoading
}) => (
  <AssetCounts>
    <AssetCounts.Count isLoading={usersLoading} name={I18n.t('users.navigation.users')} count={userCount} />
    <AssetCounts.Count
      isLoading={invitedUsersLoading}
      name={I18n.t('users.navigation.invited_users')}
      count={invitedUserCount}
    />
    {enableTeams && (
      <AssetCounts.Count
        isLoading={teamsLoading}
        name={I18n.t('users.navigation.teams')}
        count={teamsCount}
      />
    )}
  </AssetCounts>
);

Counts.propTypes = {
  I18n: I18nPropType.isRequired,
  enableTeams: PropTypes.bool.isRequired,
  invitedUserCount: PropTypes.number.isRequired,
  invitedUsersLoading: PropTypes.bool.isRequired,
  teamsCount: PropTypes.number.isRequired,
  userCount: PropTypes.number.isRequired,
  usersLoading: PropTypes.bool.isRequired,
  teamsLoading: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  enableTeams: Selectors.getEnableTeams(state),
  invitedUserCount: Selectors.getInvitedUserCount(state),
  invitedUsersLoading: Selectors.getInvitedUsersLoading(state),
  teamsCount: Selectors.getTeamsCount(state),
  userCount: Selectors.getUsersResultCount(state),
  usersLoading: Selectors.getUsersLoadingData(state),
  teamsLoading: Selectors.getTeamsLoadingData(state)
});

export default fullConnect(mapStateToProps)(Counts);
