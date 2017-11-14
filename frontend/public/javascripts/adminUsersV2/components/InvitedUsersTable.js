import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { LocalizedInvitedUserRow } from './InvitedUserRow';
import _ from 'lodash';
import connectLocalization from 'common/i18n/components/connectLocalization';

export class InvitedUsersTable extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'userToRow', 'renderHeaderRow', 'renderDataRows');
  }

  userToRow(user) {
    return <LocalizedInvitedUserRow {...user} key={user.id} />;
  }

  renderHeaderRow() {
    const { I18n } = this.props;

    return (
      <thead className="results-list-header">
        <tr>
          <th>{I18n.t('users.headers.email')}</th>
          <th>{I18n.t('users.headers.role')}</th>
          <th>{I18n.t('users.headers.invited')}</th>
          <th>{I18n.t('users.headers.actions')}</th>
        </tr>
      </thead>
    );
  }

  renderDataRows() {
    return <tbody>{this.props.invitedUsers.map(this.userToRow)}</tbody>;
  }

  render() {
    return (
      <table
        className="result-list-table table table-discrete table-condensed table-borderless"
        id="invited-users-table"
      >
        {this.renderHeaderRow()}
        {this.renderDataRows()}
      </table>
    );
  }
}

InvitedUsersTable.propTypes = {
  invitedUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
  I18n: PropTypes.object.isRequired
};

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
  return { invitedUsers };
};

export const ConnectedInvitedUsersTable = connectLocalization(connect(mapStateToProps)(InvitedUsersTable));
