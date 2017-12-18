import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import ResultsTable from '../../components/ResultsTable';
import DateFromNow from '../../components/DateFromNow';
import { SocrataIcon } from 'common/components';
import RolePicker from '../../roles/components/RolePicker';
import DropdownButton, { DropdownItem } from '../../components/DropdownButton';
import Pager from 'common/components/Pager';
import connectLocalization from 'common/i18n/components/connectLocalization';
import { changeUserRole, removeUserRole } from '../../roles/actions';
import { gotoPage, resetPassword, sortColumn } from '../actions';
import isUndefined from 'lodash/isUndefined';
import {
  getUsers,
  getUsersCurrentPage,
  getUsersLoadingData,
  getUsersOrderBy,
  getUsersResultCount,
  getUsersResultsLimit,
  getUsersSortDirection
} from '../../reducers';
import CSVExportButton from './CSVExportButton';
import { SORT_KEYS } from 'common/users-api';

export class UsersTable extends Component {
  static propTypes = {
    I18n: PropTypes.object.isRequired,
    loadingData: PropTypes.bool.isRequired,
    onChangePage: PropTypes.func.isRequired,
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

  renderPendingActionStatus = pendingRole => {
    if (isUndefined(pendingRole)) return;

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
    const currentRoleId = isUndefined(pendingRole) ? roleId : pendingRole;
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
    const {
      I18n,
      currentPage,
      loadingData,
      onChangePage,
      orderBy,
      resultCount,
      resultsPerPage,
      onSort,
      sortDirection,
      users
    } = this.props;
    const noResultsMessage = I18n.t('users.no_results');

    return (
      <div>
        <ResultsTable data={users} rowKey="id" loadingData={loadingData} noResultsMessage={noResultsMessage}>
          <ResultsTable.Column
            isActive={orderBy === SORT_KEYS.SCREEN_NAME}
            sortDirection={sortDirection}
            onSort={() => onSort(SORT_KEYS.SCREEN_NAME)}
            header={I18n.t('users.headers.name')}
            dataIndex="screenName"
          >
            {this.renderScreenNameCell}
          </ResultsTable.Column>
          <ResultsTable.Column
            isActive={orderBy === SORT_KEYS.EMAIL}
            sortDirection={sortDirection}
            onSort={() => onSort(SORT_KEYS.EMAIL)}
            header={I18n.t('users.headers.email')}
            dataIndex="email"
          />
          <ResultsTable.Column
            isActive={orderBy === SORT_KEYS.LAST_AUTHENTICATED_AT}
            sortDirection={sortDirection}
            onSort={() => onSort(SORT_KEYS.LAST_AUTHENTICATED_AT)}
            header={I18n.t('users.headers.last_active')}
            dataIndex="lastAuthenticatedAt"
          >
            {this.renderLastActiveCell}
          </ResultsTable.Column>
          <ResultsTable.Column
            isActive={orderBy === SORT_KEYS.ROLE_NAME}
            sortDirection={sortDirection}
            onSort={() => onSort(SORT_KEYS.ROLE_NAME)}
            header={I18n.t('users.headers.role')}
            dataIndex="roleId"
            dataClassName="role-picker-cell"
          >
            {this.renderRoleCell}
          </ResultsTable.Column>
          <ResultsTable.Column
            header={I18n.t('users.headers.actions')}
            dataIndex="id"
            dataClassName="action-menu-cell"
          >
            {this.renderEditControl}
          </ResultsTable.Column>
        </ResultsTable>
        <div className="results-list-footer">
          <Pager
            changePage={onChangePage}
            currentPage={currentPage}
            resultCount={resultCount}
            resultsPerPage={resultsPerPage}
          />
          <CSVExportButton />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  currentPage: getUsersCurrentPage(state),
  loadingData: getUsersLoadingData(state),
  orderBy: getUsersOrderBy(state),
  resultCount: getUsersResultCount(state),
  resultsPerPage: getUsersResultsLimit(state),
  sortDirection: getUsersSortDirection(state),
  users: getUsers(state)
});

const mapDispatchToProps = {
  onChangePage: gotoPage,
  onRemoveUserRole: removeUserRole,
  onResetPassword: resetPassword,
  onRoleChange: changeUserRole,
  onSort: sortColumn
};

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(UsersTable));
