import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Dropdown, SocrataIcon } from 'common/components';
import _ from 'lodash';
import moment from 'moment';
import connectLocalization from 'common/i18n/components/connectLocalization';

export class UserRow extends React.Component {

  renderDisplayName() {
    return (
      <td>
        <SocrataIcon name="user" />
        <a href={`/profile/${this.props.id}`}>
          {this.props.screenName}
        </a>
      </td>
    );
  }

  renderEmail() {
    return (
      <td>{this.props.email}</td>
    );
  }

  renderLastActive() {
    const { I18n, lastAuthenticatedAt } = this.props;
    let lastActiveText;

    if (_.isUndefined(lastAuthenticatedAt)) {
      // users that have not logged in since we started tracking this
      lastActiveText = I18n.t('users.last_active.unknown');
    } else if (moment(lastAuthenticatedAt, 'X').isSame(moment(), 'day')) {
      // we only update once a day, no point in showing more granular than that
      lastActiveText = I18n.t('users.last_active.today');
    } else {
      lastActiveText = moment(lastAuthenticatedAt, 'X').fromNow();
    }

    return (<td>{lastActiveText}</td>);
  }

  renderPendingActionStatus() {
    if (_.isUndefined(this.props.pendingRole)) return;

    return (
      <div className="pending-action-span">
        <div className="pending-action-cover">
          <span className="spinner-default spinner-medium" />
        </div>
      </div>
    );
  }

  renderRolePicker() {
    const { availableRoles, I18n } = this.props;

    const options = availableRoles.map((role) => {
      const title = role.isDefault ?
        I18n.t(`roles.default_roles.${role.name}.name`) :
        role.name;
      return {
        title,
        value: role.id
      };
    });


    return (
      <td className="role-picker-cell">
        <Dropdown
          onSelection={(selection) => this.props.onRoleChange(selection.value)}
          options={options}
          size="medium"
          value={_.isUndefined(this.props.pendingRole) ?
            this.props.roleId : this.props.pendingRole} />
            {this.renderPendingActionStatus()}
      </td>
    );
  }

  render() {
    return (
      <tr key={this.props.id} className="result-list-row" >
        {this.renderDisplayName()}
        {this.renderEmail()}
        {this.renderLastActive()}
        {this.renderRolePicker()}
      </tr>
    );
  }
}

UserRow.propTypes = {
  screenName: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  lastAuthenticatedAt: PropTypes.number,
  availableRoles: PropTypes.arrayOf(PropTypes.object).isRequired,
  roleName: PropTypes.string.isRequired,
  roleId: PropTypes.string.isRequired,
  pendingRole: PropTypes.string,
  onRoleChange: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state) => {
  return {
    availableRoles: state.roles
  };
};

export const LocalizedUserRow = connectLocalization(
  connect(mapStateToProps)(UserRow)
);
