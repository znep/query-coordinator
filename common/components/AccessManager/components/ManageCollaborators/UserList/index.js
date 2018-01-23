import React, { Component } from 'react';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import { userHasAccessLevel } from 'common/components/AccessManager/Util';
import { ACCESS_LEVELS } from 'common/components/AccessManager/Constants';
import PermissionPropType from 'common/components/AccessManager/propTypes/PermissionPropType';

import OwnerUserDetails from './OwnerUserDetails';
import UserDetailsWithAccessLevel from './UserDetailsWithAccessLevel';
import styles from './user-list.module.scss';

/**
 * Display a list of all the users who have acess to a dataset,
 * including the owner, along with actions that can be taken on them.
 */
class UserList extends Component {
  static propTypes = {
    permissions: PermissionPropType
  }

  shouldRenderNoUsersMessage = () => {
    const { permissions } = this.props;

    // render message if the only user we have is the owner
    return (
      isEmpty(permissions.users) ||
      isEmpty(permissions.users.filter(user => !userHasAccessLevel(user, ACCESS_LEVELS.CURRENT_OWNER)))
    );
  }

  renderNoUsersMessage = () => (
    <div styleName="no-users-message">
      <em>{I18n.t('shared.site_chrome.access_manager.no_collaborators')}</em>
    </div>
  )

  renderOwner = (owner) => (
    // current owner can potentially appear in the list twice, so we need to give them a special key
    <div key={`current_owner-${owner.email}`}>
      <OwnerUserDetails user={owner} />
      <hr />
    </div>
  )

  renderUser = (user) => {
    const { accessLevels, email } = user;

    // just using the first accessLevel in the list for now; if/when we want to add multiple in the future,
    // this will have to be changed (along with the dropdown)
    const accessLevel = accessLevels[0];

    return (
      <div key={email}>
        <UserDetailsWithAccessLevel user={user} accessLevel={accessLevel} />
        <hr />
      </div>
    );
  }

  render() {
    const { permissions } = this.props;
    const { users } = permissions;

    const owner = users.find(user => userHasAccessLevel(user, ACCESS_LEVELS.CURRENT_OWNER));
    const filteredUsers = users.filter(user => !userHasAccessLevel(user, ACCESS_LEVELS.CURRENT_OWNER));

    return (
      <div>
        {owner && this.renderOwner(owner)}
        {this.shouldRenderNoUsersMessage() ?
            this.renderNoUsersMessage() :
            filteredUsers.map(this.renderUser)
        }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  permissions: state.permissions.permissions
});

export default connect(mapStateToProps)(cssModules(UserList, styles));
