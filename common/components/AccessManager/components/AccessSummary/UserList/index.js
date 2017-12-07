import React, { Component } from 'react';
import { connect } from 'react-redux';

import PermissionPropType from '../../../propTypes/PermissionPropType';
import OwnerUserDetails from './OwnerUserDetails';
import UserDetailsWithAccessLevel from './UserDetailsWithAccessLevel';
import { userHasAccessLevel } from '../../../Util';
import { ACCESS_LEVELS } from '../../../Constants';

/**
 * Display a list of all the users who have acess to a dataset,
 * including the owner, along with actions that can be taken on them.
 */
class UserList extends Component {
  static propTypes = {
    permissions: PermissionPropType
  }

  renderUser = (user) => {
    const accessLevels = user.accessLevels;
    const isCurrentOwner = userHasAccessLevel(user, ACCESS_LEVELS.CURRENT_OWNER);

    // just using the first accessLevel in the list for now; if/when we want to add multiple in the future,
    // this will have to be changed (along with the dropdown)
    const accessLevel = accessLevels[0];

    if (isCurrentOwner) {
      // current owner can potentially appear in the list twice, so we need to give them a special key
      return (
        <div key={`current_owner-${user.email}`}>
          <OwnerUserDetails user={user} />
          <hr />
        </div>
      );
    } else {
      return (
        <div key={user.email}>
          <UserDetailsWithAccessLevel user={user} accessLevel={accessLevel} />
          <hr />
        </div>
      );
    }
  }

  render() {
    const { permissions } = this.props;

    return (
      <div>
        {permissions.users.map(user => this.renderUser(user))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  permissions: state.permissions.permissions
});

export default connect(mapStateToProps)(UserList);
