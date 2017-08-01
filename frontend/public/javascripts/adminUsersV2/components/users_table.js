import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import UserRow from './user_row';
import _ from 'lodash';
import * as Actions from '../actions';

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
      isSelected,
      onSelectionChange,
      screenName: user.screenName,
      userId: user.id,
      email: user.email,
      lastActive: 'TBD',
      availableRoles,
      currentRole: user.roleName,
      pendingRole: user.pendingRole,
      onRoleChange
    };

    return (
      <UserRow
        {...userProps}
        key={user.id} />
    );
  }

  renderHeaderRow() {
    return (
      <thead className="results-list-header">
        <tr>
          <th>
            <input
              type="checkbox"
              checked={this.props.selectAll}
              onChange={() => this.props.onSelectAll(!this.props.selectAll)} />
          </th>
          <th>Name</th>
          <th>Email</th>
          <th>Last Sign In</th>
          <th>Role</th>
          <th>Actions</th>
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
  onSelectAll: PropTypes.func.isRequired
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

export const ConnectedUsersTable = connect(mapStateToProps, mapDispatchToProps)(UsersTable);
