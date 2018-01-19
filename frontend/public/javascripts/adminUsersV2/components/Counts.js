import React from 'react';
import PropTypes from 'prop-types';
import { connect as fullConnect } from '../utils';
import AssetCounts from './AssetCounts';
import * as Selectors from '../selectors';

export const Counts = ({
  I18n,
  invitedUserCount,
  invitedUsersLoading,
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
  </AssetCounts>
);

Counts.propTypes = {
  I18n: PropTypes.object.isRequired,
  invitedUserCount: PropTypes.number.isRequired,
  invitedUsersLoading: PropTypes.bool.isRequired,
  userCount: PropTypes.number.isRequired,
  usersLoading: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  invitedUserCount: Selectors.getInvitedUserCount(state),
  invitedUsersLoading: Selectors.getInvitedUsersLoading(state),
  userCount: Selectors.getUsersResultCount(state),
  usersLoading: Selectors.getUsersLoadingData(state)
});

export default fullConnect(mapStateToProps)(Counts);
