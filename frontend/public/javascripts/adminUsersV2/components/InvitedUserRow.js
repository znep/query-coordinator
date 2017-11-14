import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import moment from 'moment';
import DropdownButton, { DropdownItem } from './DropdownButton';
import * as Actions from '../actions';
import _ from 'lodash';

export class InvitedUserRow extends React.Component {
  constructor() {
    super();
    _.bindAll(this, ['renderEditControl']);
  }

  renderEditControl() {
    const { I18n, removeInvitedUser, resendInvitedUserEmail } = this.props;
    return (
      <DropdownButton>
        <DropdownItem onClick={() => removeInvitedUser()}>
          {I18n.translate('users.actions.remove_invited_user')}
        </DropdownItem>
        <DropdownItem onClick={() => resendInvitedUserEmail()}>
          {I18n.translate('users.actions.resend_invited_user_email')}
        </DropdownItem>
      </DropdownButton>
    );
  }

  render() {
    const { email, id, invited, invitedLabel, role } = this.props;
    return (
      <tr key={id} className="result-list-row">
        <td>{email}</td>
        <td>{role}</td>
        <td title={invited}>{invitedLabel}</td>
        <td>{this.renderEditControl()}</td>
      </tr>
    );
  }
}

InvitedUserRow.propTypes = {
  email: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  invited: PropTypes.string.isRequired,
  invitedLabel: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state, { createdAt }) => {
  const createdAtMoment = moment(createdAt, 'X');
  return {
    invitedLabel: createdAtMoment.fromNow(),
    invited: createdAtMoment.format('LLLL')
  };
};

const mapDispatchToProps = (dispatch, { email, id }) => {
  return {
    removeInvitedUser: () => Actions.removeInvitedUser(id)(dispatch),
    resendInvitedUserEmail: () => Actions.resendInvitedUserEmail(email)(dispatch)
  };
};

export const LocalizedInvitedUserRow = connectLocalization(connect(mapStateToProps, mapDispatchToProps)(InvitedUserRow));
