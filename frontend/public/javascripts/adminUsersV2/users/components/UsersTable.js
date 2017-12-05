import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import ResultsTable, { TableColumn } from '../../components/ResultsTable';
import DateFromNow from '../../components/DateFromNow';
import { SocrataIcon } from 'common/components';
import RolePicker from '../../roles/components/RolePicker';
import DropdownButton, { DropdownItem } from '../../components/DropdownButton';
import connectLocalization from 'common/i18n/components/connectLocalization';
import { changeUserRole, removeUserRole } from '../../roles/actions';
import { resetPassword } from '../actions';

export class UsersTable extends Component {
  static propTypes = {
    I18n: PropTypes.object.isRequired,
    loadingData: PropTypes.bool.isRequired,
    onRemoveUserRole: PropTypes.func.isRequired,
    onResetPassword: PropTypes.func.isRequired,
    onRoleChange: PropTypes.func.isRequired,
    users: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  renderLastActiveCell = lastActive => {
    const { I18n } = this.props;
    return (
      <DateFromNow
        timestamp={lastActive}
        todayLabel={I18n.t('users.last_active.today')}
        unknownLabel={I18n.t('users.last_active.unknown')}
      />
    );
  };

  renderScreenNameCell = (screenName, { id }) => (
    <span>
      <SocrataIcon name="user" />
      <a href={`/profile/${id}`}>{screenName}</a>
    </span>
  );

  renderPendingActionStatus = (pendingRole) => {
    if (_.isUndefined(pendingRole)) return;

    return (
      <div className="pending-action-span">
        <div className="pending-action-cover">
          <span className="spinner-default spinner-medium" />
        </div>
      </div>
    );
  };

  renderRoleCell = (roleId, { id, pendingRole }) => {
    const onRoleChange = newRole => this.props.onRoleChange(id, newRole);
    const currentRoleId = _.isUndefined(pendingRole) ? roleId : pendingRole;
    return (
      <div>
        <RolePicker roleId={currentRoleId} onRoleChange={onRoleChange} />
        {this.renderPendingActionStatus(pendingRole)}
      </div>
    );
  };

  renderEditControl = (userId, { roleId }) => {
    const { I18n, onRemoveUserRole, onResetPassword } = this.props;
    return (
      <DropdownButton isDisabled={roleId === 'none'}>
        <DropdownItem onClick={() => onRemoveUserRole(userId, roleId)}>
          {I18n.t('users.actions.remove_role')}
        </DropdownItem>
        <DropdownItem onClick={() => onResetPassword(userId)}>
          {I18n.t('users.actions.reset_password')}
        </DropdownItem>
      </DropdownButton>
    );
  };

  render() {
    const { I18n, users } = this.props;
    const noResultsMessage = I18n.t('users.no_results');

    return (
      <ResultsTable
        data={users}
        rowKey="id"
        loadingData={this.props.loadingData}
        noResultsMessage={noResultsMessage}>
        <TableColumn header={I18n.t('users.headers.name')} dataIndex="screenName">
          {this.renderScreenNameCell}
        </TableColumn>
        <TableColumn header={I18n.t('users.headers.email')} dataIndex="email" />
        <TableColumn header={I18n.t('users.headers.last_active')} dataIndex="lastAuthenticatedAt">
          {this.renderLastActiveCell}
        </TableColumn>
        <TableColumn
          header={I18n.t('users.headers.role')}
          dataIndex="roleId"
          dataClassName="role-picker-cell">
          {this.renderRoleCell}
        </TableColumn>
        <TableColumn header={I18n.t('users.headers.actions')} dataIndex="id" dataClassName="action-menu-cell">
          {this.renderEditControl}
        </TableColumn>
      </ResultsTable>
    );
  }
}

const mapStateToProps = state => {
  return {
    loadingData: state.ui.loadingData,
    users: state.users
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onRemoveUserRole: (userId, roleId) => dispatch(removeUserRole(userId, roleId)),
    onResetPassword: userId => dispatch(resetPassword(userId)),
    onRoleChange: (userId, newRole) => dispatch(changeUserRole(userId, newRole))
  };
};

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(UsersTable));
