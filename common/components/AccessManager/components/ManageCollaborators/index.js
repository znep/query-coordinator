import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import PermissionPropType from 'common/components/AccessManager/propTypes/PermissionPropType';
import AddUser from 'common/components/AccessManager/components/AddUser';

import UserList from './UserList';
import styles from './manage-collaborators.module.scss';


/**
 * Shows a summary of the current permissions for a given asset.
 * That is, it's "audience" setting (public, private, etc.)
 * and all the users it has been shared to.
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
    const { permissions, errors } = this.props;

    // if the "permissions" object exists, it means we've gotten back results from our API call
    if (permissions) {
      return (
        <div>
          <div styleName="manage-collaborators-container">
            <UserList />
          </div>
          <AddUser />
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
