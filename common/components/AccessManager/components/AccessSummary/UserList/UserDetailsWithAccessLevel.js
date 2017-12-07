import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import styles from './user-details-with-access-level.scss';
import AccessLevelDropdown from '../../AccessLevelDropdown';
import SocrataIcon from '../../../../SocrataIcon';
import UserDetails from '../../UserDetails';
import UserPropType from '../../../propTypes/UserPropType';
import UserAccessLevelPropType from '../../../propTypes/UserAccessLevelPropType';
import * as permissionsActions from '../../../actions/PermissionsActions';

/**
 * Renders user details with an access level dropdown next to them,
 * as well as a button to remove their access.
 */
class UserDetailsWithAccessLevel extends Component {
  static propTypes = {
    user: UserPropType,
    changeUserAccessLevel: PropTypes.func,
    accessLevel: UserAccessLevelPropType,
    removeUser: PropTypes.func
  }

  renderActions = () => {
    const {
      user,
      changeUserAccessLevel,
      accessLevel,
      removeUser
    } = this.props;

    // TODO are there "read-only" scenarios for these that shouldn't show any actions here?

    return (
      <div styleName="user-options-container">
        <AccessLevelDropdown
          value={accessLevel}
          onSelection={(level) => { changeUserAccessLevel(user, level.value); }} />
        <button styleName="remove-button" onClick={() => { removeUser(user); }}>
          <SocrataIcon name="close" styleName="remove-icon" />
        </button>
      </div>
    );
  }

  render() {
    const { user } = this.props;
    return (
      <UserDetails user={user}>
        {this.renderActions()}
      </UserDetails>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  changeUserAccessLevel: (user, level) => dispatch(permissionsActions.changeUserAccessLevel(user, level)),
  removeUser: user => dispatch(permissionsActions.removeUserAccess(user))
});

export default connect(null, mapDispatchToProps)(cssModules(UserDetailsWithAccessLevel, styles));
