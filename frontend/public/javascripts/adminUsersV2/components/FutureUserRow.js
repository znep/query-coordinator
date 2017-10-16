import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import moment from 'moment';

export class FutureUserRow extends React.Component {
  render() {
    const { email, id, invited, invitedLabel, role } = this.props;
    return (
      <tr key={id} className="result-list-row">
        <td>{email}</td>
        <td>{role}</td>
        <td title={invited}>{invitedLabel}</td>
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

const mapStateToProps = (state, props) => {
  const createdAt = moment(props.createdAt, 'X');
  return {
    invitedLabel: createdAt.fromNow(),
    invited: createdAt.format('LLLL')
  };
};

export const LocalizedFutureUserRow = connectLocalization(connect(mapStateToProps)(FutureUserRow));
