import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import { userHasAccessLevel } from 'common/components/AccessManager/Util';
import { ACCESS_LEVELS, ACCESS_LEVEL_VERSIONS } from 'common/components/AccessManager/Constants';
import PermissionPropType from 'common/components/AccessManager/propTypes/PermissionPropType';

import UserList from 'common/components/AccessManager/components/UserList';

import AddCollaborators from './AddCollaborators';
import styles from './manage-collaborators.module.scss';


/**
 * Shows all of the current collaborators, with ways to add, remove, and change them
 */
class ManageCollaborators extends Component {
  static propTypes = {
    permissions: PermissionPropType,
    errors: PropTypes.arrayOf(PropTypes.any)
  };

  static defaultProps = {
    permissions: [],
    errors: []
  };

  render() {
    const {
      permissions,
      errors
    } = this.props;

    // if the "permissions" object exists, it means we've gotten back results from our API call
    if (permissions) {
      return (
        <div>
          <div styleName="manage-collaborators-container">
            {/* User List filtered to only show users WITHOUT published viewer access */}
            <UserList
              noUsersMessage={I18n.t('shared.site_chrome.access_manager.no_collaborators')}
              userFilter={
                user => !userHasAccessLevel(user, ACCESS_LEVELS.VIEWER, ACCESS_LEVEL_VERSIONS.PUBLISHED)
              } />
          </div>
          <AddCollaborators />
        </div>
      );
    }

    // if there are errors, it means our api call failed
    if (errors && errors.length !== 0) {
      return null;
    } else {
      // no errors and no permissions; waiting for api call to finish
      return (
        <div styleName="spinner-container">
          <div className="spinner-default spinner-large" />
        </div>
      );
    }
  }
}

const mapStateToProps = state => ({
  permissions: state.permissions.permissions,
  errors: state.ui.errors
});

export default
  connect(mapStateToProps)(cssModules(ManageCollaborators, styles));
