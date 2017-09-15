import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { LocalizedUserRow } from './user_row';
import _ from 'lodash';
import * as Actions from '../actions';
import connectLocalization from 'common/i18n/components/connectLocalization';

export class UsersTable extends React.Component {

  constructor(props) {
    super(props);

    _.bindAll(this,
      'userToRow',
      'renderHeaderRow',
      'renderDataRows'
    );
  }

  userToRow(user) {
    const availableRoles = [
      {
        title: 'Administrator',
        value: 'administrator'
      },
      {
        title: 'Designer',
        value: 'designer'
      },
      {
        title: 'Editor',
        value: 'editor'
      },
      {
        title: 'Publisher',
        value: 'publisher'
      },
      {
        title: 'Viewer',
        value: 'viewer'
      }
    ];

    const isSelected = _.get(user, 'isSelected', false);
    const onSelectionChange = () => this.props.onSelectionChange(user.id, !isSelected);
    const onRoleChange = (newRole) => this.props.onRoleChange(user.id, newRole);

    const userProps = {
      // user properties
      screenName: user.screenName,
      userId: user.id,
      email: user.email,
      lastActive: user.lastAuthenticatedAt,
      currentRole: user.roleName,
      pendingRole: user.pendingRole,
      isSelected,
      // handlers
      onSelectionChange,
      onRoleChange,
      // domain-level properties
      availableRoles
    };

    return (
      <LocalizedUserRow
        {...userProps}
        key={user.id} />
    );
  }

  renderHeaderRow() {
    const { I18n, selectAll, onSelectAll } = this.props;

    return (
      <thead className="results-list-header">
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={() => onSelectAll(!selectAll)} />
          </th>
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
    return (
      <tbody>
        {this.props.users.map(this.userToRow)}
      </tbody>
    );
  }

  render() {
    return (
      <table
        className="result-list-table table table-discrete table-condensed table-borderless"
        id="users-table" >
        {this.renderHeaderRow()}
        {this.renderDataRows()}
      </table>
    );
  }
}

UsersTable.propTypes = {
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  selectAll: PropTypes.bool.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state) => {
  return {
    users: state.users,
    selectAll: state.selectAll
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onRoleChange: (userId, newRole) => { dispatch(Actions.changeUserRole(userId, newRole)); },
    onSelectionChange: (userId, selectionState) => {
      dispatch(Actions.userSelection(userId, selectionState));
    },
    onSelectAll: (selectionState) => {
      dispatch(Actions.userSelection(null, selectionState, true));
    }
  };
};

export const ConnectedUsersTable = connectLocalization(
  connect(mapStateToProps, mapDispatchToProps)(UsersTable)
);
