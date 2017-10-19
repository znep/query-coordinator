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

    return (
      <LocalizedUserRow
        {...user}
        onRoleChange={onRoleChange}
        onRemoveUserRole={onRemoveUserRole}
        key={user.id} />
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
    return <tbody>{this.props.users.map(this.userToRow)}</tbody>;
  }

  render() {
    return (
      <table
        className="result-list-table table table-discrete table-condensed table-borderless"
        id="users-table">
        {this.renderHeaderRow()}
        {this.renderDataRows()}
      </table>
    );
  }
}

UsersTable.propTypes = {
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onRemoveUserRole: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    users: state.users
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onRoleChange: (userId, newRole) => dispatch(Actions.changeUserRole(userId, newRole)),
    onRemoveUserRole: (userId, roleId) => dispatch(Actions.removeUserRole(userId, roleId))
  };
};

export const ConnectedUsersTable = connectLocalization(
  connect(mapStateToProps, mapDispatchToProps)(UsersTable)
);
