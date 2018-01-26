import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect as fullConnect, I18nPropType } from '../../utils';
import ResultsTable from '../../components/ResultsTable';
import DateFromNow from '../../components/DateFromNow';
import SocrataIcon from 'common/components/SocrataIcon';
import RolePicker from '../../roles/components/RolePicker';
import DropdownButton, { DropdownItem } from '../../components/DropdownButton';
import Pager from 'common/components/Pager';
import * as RolesActions from '../../roles/actions';
import * as Actions from '../actions';
import * as Selectors from '../../selectors';
import isUndefined from 'lodash/isUndefined';

import CSVExportButton from './CSVExportButton';
import { SORT_KEYS } from 'common/users-api';

export class UsersTable extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
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

  handleRemoveUserRole = (userId, roleId, screenName) => {
    const { I18n, onRemoveUserRole } = this.props;

    if (window.confirm(I18n.t('users.actions.confirm_remove_user', { screenName }))) {
      onRemoveUserRole(userId, roleId);
    }
  };

  renderEditControl = (userId, { roleId, screenName }) => {
    const { I18n, onResetPassword } = this.props;
    return (
      <DropdownButton isDisabled={roleId === 'none'}>
        <DropdownItem onClick={() => this.handleRemoveUserRole(userId, roleId, screenName)}>
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

const mapStateToProps = state => {
  const searchResultCount = Selectors.getUserSearchResultCount(state);

  return ({
    currentPage: Selectors.getUsersCurrentPage(state),
    loadingData: Selectors.getUsersLoadingData(state),
    orderBy: Selectors.getUsersOrderBy(state),
    resultCount: isUndefined(searchResultCount) ? Selectors.getUsersResultCount(state) : searchResultCount,
    resultsPerPage: Selectors.getUsersResultsLimit(state),
    sortDirection: Selectors.getUsersSortDirection(state),
    users: Selectors.getUsers(state)
  });
};

const mapDispatchToProps = {
  onChangePage: Actions.gotoUserPage,
  onRemoveUserRole: RolesActions.removeUserRole,
  onResetPassword: Actions.resetPassword,
  onRoleChange: RolesActions.changeUserRole,
  onSort: Actions.sortUserColumn
};

export default fullConnect(mapStateToProps, mapDispatchToProps)(UsersTable);
