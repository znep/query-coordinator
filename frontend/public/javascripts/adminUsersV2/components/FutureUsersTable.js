import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { LocalizedFutureUserRow } from './FutureUserRow';
import _ from 'lodash';
import connectLocalization from 'common/i18n/components/connectLocalization';

export class FutureUsersTable extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'userToRow', 'renderHeaderRow', 'renderDataRows');
  }

  userToRow(user) {
    return <LocalizedFutureUserRow {...user} key={user.id} />;
  }

  renderHeaderRow() {
    const { I18n } = this.props;

    return (
      <thead className="results-list-header">
        <tr>
          <th>{I18n.t('users.headers.email')}</th>
          <th>{I18n.t('users.headers.role')}</th>
          <th>{I18n.t('users.headers.invited')}</th>
        </tr>
      </thead>
    );
  }

  renderDataRows() {
    return <tbody>{this.props.futureUsers.map(this.userToRow)}</tbody>;
  }

  render() {
    return (
      <table
        className="result-list-table table table-discrete table-condensed table-borderless"
        id="future-users-table"
      >
        {this.renderHeaderRow()}
        {this.renderDataRows()}
      </table>
    );
  }
}

FutureUsersTable.propTypes = {
  futureUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state, props) => {
  const { I18n } = props;
  const { roles } = state;
  const futureUsers = state.futureUsers.map(futureUser => {
    const roleName = _.get(
      roles.find(role => _.toString(role.id) === _.toString(futureUser.pendingRoleId)),
      'name'
    );
    return {
      ...futureUser,
      role: I18n.t(`roles.default_roles.${roleName}.name`)
    };
  });
  return { futureUsers };
};

export const ConnectedFutureUsersTable = connectLocalization(connect(mapStateToProps)(FutureUsersTable));
