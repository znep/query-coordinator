/* eslint-disable no-shadow */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import connectLocalization from 'common/i18n/components/connectLocalization';
import ResultsTable, { TableColumn } from '../../components/ResultsTable';
import DropdownButton, { DropdownItem } from '../../components/DropdownButton';
import { removeInvitedUser, resendInvitedUserEmail } from '../actions';
import DateFromNow from '../../components/DateFromNow';

export class InvitedUsersTable extends React.Component {
  static propTypes = {
    invitedUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
    loadingData: PropTypes.bool.isRequired,
    I18n: PropTypes.object.isRequired
  };

  renderInvitedCell = createdAt => <DateFromNow timestamp={createdAt} />;

  renderActionsCell = (id, { email }) => {
    const { I18n, removeInvitedUser, resendInvitedUserEmail } = this.props;
    return (
      <DropdownButton>
        <DropdownItem onClick={() => removeInvitedUser(id)}>
          {I18n.translate('users.actions.remove_invited_user')}
        </DropdownItem>
        <DropdownItem onClick={() => resendInvitedUserEmail(email)}>
          {I18n.translate('users.actions.resend_invited_user_email')}
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
        <TableColumn dataIndex="email" header={I18n.t('users.headers.email')} />
        <TableColumn dataIndex="role" header={I18n.t('users.headers.role')} />
        <TableColumn dataIndex="createdAt" header={I18n.t('users.headers.invited')}>
          {this.renderInvitedCell}
        </TableColumn>
        <TableColumn dataIndex="id" header={I18n.t('users.headers.actions')}>
          {this.renderActionsCell}
        </TableColumn>
      </ResultsTable>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { I18n } = props;
  const { roles } = state;
  const invitedUsers = state.invitedUsers.map(invitedUser => {
    const role = roles.find(r => _.toString(r.id) === _.toString(invitedUser.pendingRoleId));
    if (role.isDefault) {
      return {
        ...invitedUser,
        role: I18n.t(`roles.default_roles.${role.name}.name`)
      };
    } else {
      return {
        ...invitedUser,
        role: role.name
      };
    }
  });
  return {
    invitedUsers,
    loadingData: state.ui.loadingData
  };
};

const mapDispatchToProps = dispatch => {
  return {
    removeInvitedUser: id => removeInvitedUser(id)(dispatch),
    resendInvitedUserEmail: email => resendInvitedUserEmail(email)(dispatch)
  };
};

export const ConnectedInvitedUsersTable = connectLocalization(
  connect(mapStateToProps, mapDispatchToProps)(InvitedUsersTable)
);
