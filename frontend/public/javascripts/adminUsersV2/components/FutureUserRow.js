import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import moment from 'moment';
import DropdownButton, { DropdownItem } from './DropdownButton';
import * as Actions from '../actions';
import _ from 'lodash';

export class FutureUserRow extends React.Component {
  constructor() {
    super();
    _.bindAll(this, ['renderEditControl']);
  }

  renderEditControl() {
    const { I18n, removeFutureUser, resendPendingUserEmail } = this.props;
    return (
      <DropdownButton>
        <DropdownItem onClick={() => removeFutureUser()}>
          {I18n.translate('users.actions.remove_pending_user')}
        </DropdownItem>
        <DropdownItem onClick={() => resendPendingUserEmail()}>
          {I18n.translate('users.actions.resend_pending_user_email')}
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

FutureUserRow.propTypes = {
  id: PropTypes.number.isRequired,
  email: PropTypes.string.isRequired,
  invited: PropTypes.string.isRequired,
  invitedLabel: PropTypes.string.isRequired,
  pendingRoleId: PropTypes.number.isRequired,
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
    removeFutureUser: () => Actions.removeFutureUser(id)(dispatch),
    resendPendingUserEmail: () => Actions.resendPendingUserEmail(email)(dispatch)
  };
};

export const LocalizedFutureUserRow = connectLocalization(connect(mapStateToProps, mapDispatchToProps)(FutureUserRow));
