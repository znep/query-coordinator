import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { LocalizedUserRow } from './UserRow';
import _ from 'lodash';
import * as Actions from '../actions';
import connectLocalization from 'common/i18n/components/connectLocalization';

export class UsersTable extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'userToRow', 'renderHeaderRow', 'renderDataRows');
  }

  userToRow(user) {
    const onRoleChange = newRole => this.props.onRoleChange(user.id, newRole);
    const onRemoveUserRole = () => this.props.onRemoveUserRole(user.id, user.roleId);
    const onResetPassword = () => this.props.onResetPassword(user.id);

    return (
      <LocalizedUserRow
        {...user}
        onRoleChange={onRoleChange}
        onRemoveUserRole={onRemoveUserRole}
        onResetPassword={onResetPassword}
        key={user.id}
      />
    );
  }

  renderHeaderRow() {
    const { I18n } = this.props;

    return (
      <thead className="results-list-header">
        <tr>
          <th>{I18n.t('users.headers.name')}</th>
          <th>{I18n.t('users.headers.email')}</th>
          <th>{I18n.t('users.headers.last_active')}</th>
          <th>{I18n.t('users.headers.role')}</th>
          <th>{I18n.t('users.headers.actions')}</th>
        </tr>
      </thead>
    );
  }

  renderDataRows() {
    const { users, I18n, loadingData } = this.props;
    if (loadingData) {
      return (
        <tbody>
          <tr>
            <td colSpan="5" className="no-results-message">
              <span className="spinner-default spinner-large" />
            </td>
          </tr>
        </tbody>
      );
    } else if (users.length > 0) {
      return (
        <tbody>
          {users.map(this.userToRow)}
        </tbody>
      );
    } else {
      return (
        <tbody>
          <tr>
            <td colSpan="5" className="no-results-message">
              {I18n.t('users.no_results')}
            </td>
          </tr>
        </tbody>
      );
    }
  }

  render() {
    return (
      <table
        className="result-list-table table table-discrete table-condensed table-borderless"
        id="users-table"
      >
        {this.renderHeaderRow()}
        {this.renderDataRows()}
      </table>
    );
  }
}

UsersTable.propTypes = {
  loadingData: PropTypes.bool.isRequired,
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onRemoveUserRole: PropTypes.func.isRequired,
  onResetPassword: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    users: state.users,
    loadingData: state.ui.loadingData
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onRoleChange: (userId, newRole) => dispatch(Actions.changeUserRole(userId, newRole)),
    onRemoveUserRole: (userId, roleId) => dispatch(Actions.removeUserRole(userId, roleId)),
    onResetPassword: userId => dispatch(Actions.resetPassword(userId))
  };
};

export const ConnectedUsersTable = connectLocalization(
  connect(mapStateToProps, mapDispatchToProps)(UsersTable)
);
