import PropTypes from 'prop-types';
import React from 'react';
import { getRoleDisplayName } from '../../utils';
import { customConnect, I18nPropType } from 'common/connectUtils';
import toString from 'lodash/toString';
import isNil from 'lodash/isNil';
import ResultsTable from '../../components/ResultsTable';
import DateFromNow from '../../components/DateFromNow';
import DropdownButton, { DropdownItem } from '../../components/DropdownButton';
import * as Actions from '../actions';
import * as Selectors from '../../selectors';

export class InvitedUsersTable extends React.Component {
  static propTypes = {
    invitedUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
    loadingData: PropTypes.bool.isRequired,
    I18n: I18nPropType.isRequired
  };

  renderInvitedCell = createdAt => <DateFromNow timestamp={createdAt} />;

  handleRemoveInvitedUser = (id, email) => {
    const { I18n, removeInvitedUser } = this.props;
    if (window.confirm(I18n.t('users.actions.confirm_remove_invited_user', { email }))) {
      removeInvitedUser(id);
    }
  };

  renderActionsCell = (id, { email }) => {
    const { I18n, resendInvitedUserEmail } = this.props;
    return (
      <DropdownButton>
        <DropdownItem onClick={() => this.handleRemoveInvitedUser(id, email)}>
          {I18n.t('users.actions.remove_invited_user')}
        </DropdownItem>
        <DropdownItem onClick={() => resendInvitedUserEmail(email)}>
          {I18n.t('users.actions.resend_invited_user_email')}
        </DropdownItem>
      </DropdownButton>
    );
  };

  render() {
    const { I18n, invitedUsers, loadingData } = this.props;
    const noResultsMessage = I18n.t('users.no_results');
    return (
      <ResultsTable
        data={invitedUsers}
        rowKey="id"
        loadingData={loadingData}
        noResultsMessage={noResultsMessage}>
        <ResultsTable.Column dataIndex="email" header={I18n.t('users.headers.email')} />
        <ResultsTable.Column dataIndex="role" header={I18n.t('users.headers.role')} />
        <ResultsTable.Column dataIndex="createdAt" header={I18n.t('users.headers.invited')}>
          {this.renderInvitedCell}
        </ResultsTable.Column>
        <ResultsTable.Column dataIndex="id" header={I18n.t('users.headers.actions')}>
          {this.renderActionsCell}
        </ResultsTable.Column>
      </ResultsTable>
    );
  }
}

const mapStateToProps = (state, { I18n }) => {
  const roles = Selectors.getRoles(state);
  const loadingData = Selectors.getInvitedUsersLoading(state) && Selectors.getRolesLoading(state);
  const userRoleFilter = Selectors.getUserRoleFilter(state);
  const invitedUsers = (loadingData || roles.length === 0) ?
    [] :
    Selectors.getInvitedUsers(state).
      filter(invitedUser => (isNil(userRoleFilter) || toString(invitedUser.pendingRoleId) === toString(userRoleFilter))).
      map(
        invitedUser => {
          const role = roles.find(r => toString(r.id) === toString(invitedUser.pendingRoleId));
          return {
            ...invitedUser,
            role: getRoleDisplayName(role, roles, I18n)
          };
      });
  return {
    invitedUsers,
    loadingData
  };
};

const mapDispatchToProps = {
  removeInvitedUser: Actions.removeInvitedUser,
  resendInvitedUserEmail: Actions.resendInvitedUserEmail
};

export default customConnect({ mapStateToProps, mapDispatchToProps })(InvitedUsersTable);
