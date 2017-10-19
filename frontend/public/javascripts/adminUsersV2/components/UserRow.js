import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Dropdown, SocrataIcon } from 'common/components';
import _ from 'lodash';
import moment from 'moment';
import connectLocalization from 'common/i18n/components/connectLocalization';
import UserEditControl from './UserEditControl';

export class UserRow extends React.Component {
  constructor() {
    super();
    _.bindAll(['formatLastActiveTooltip', 'formatLastActive', 'renderLastActive']);
  }

  formatLastActive(lastAuthenticatedAt) {
    const { I18n } = this.props;
    if (_.isUndefined(lastAuthenticatedAt)) {
      // users that have not logged in since we started tracking this
      return I18n.t('users.last_active.unknown');
    } else if (moment(lastAuthenticatedAt, 'X').isSame(moment(), 'day')) {
      // we only update once a day, no point in showing more granular than that
      return I18n.t('users.last_active.today');
    } else {
      return moment(lastAuthenticatedAt, 'X').fromNow();
    }
  }

  formatLastActiveTooltip(lastAuthenticatedAt) {
    const { I18n } = this.props;
    if (_.isUndefined(lastAuthenticatedAt)) {
      return I18n.t('users.last_active.unknown');
    } else {
      return moment(lastAuthenticatedAt, 'X').format('LLLL');
    }
  }

  renderDisplayName() {
    return (
      <td>
        <SocrataIcon name="user" />
        <a href={`/profile/${this.props.id}`}>{this.props.screenName}</a>
      </td>
    );
  }

  renderEmail() {
    return <td>{this.props.email}</td>;
  }

  renderLastActive() {
    const { lastAuthenticatedAt } = this.props;
    const lastActiveText = this.formatLastActive(lastAuthenticatedAt);
    const lastActiveTooltip = this.formatLastActiveTooltip(lastAuthenticatedAt);

    return <td title={lastActiveTooltip}>{lastActiveText}</td>;
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

    const customRolesExist = availableRoles.some(role => !role.isDefault);

    const options = availableRoles.map(role => {
      const title = role.isDefault ?
        I18n.t(`roles.default_roles.${role.name}.name`) :
        role.name;

      if (customRolesExist) {
        const group = role.isDefault ?
          I18n.t('users.roles.default') :
          I18n.t('users.roles.custom');
        return {
          title,
          group,
          value: role.id
        };
      } else {
        return {
          title,
          value: role.id
        };
      }
    });

    return (
      <td className="role-picker-cell">
        <Dropdown
          onSelection={selection => this.props.onRoleChange(selection.value)}
          options={options}
          size="medium"
          value={_.isUndefined(this.props.pendingRole) ? this.props.roleId : this.props.pendingRole} />
        {this.renderPendingActionStatus()}
      </td>
    );
  }

  renderActionMenu() {
    return (
      <td>
        <UserEditControl
          removeRole={this.props.onRemoveUserRole} />
      </td>
    );
  }

  render() {
    return (
      <tr key={this.props.id} className="result-list-row">
        {this.renderDisplayName()}
        {this.renderEmail()}
        {this.renderLastActive()}
        {this.renderRolePicker()}
        {this.renderActionMenu()}
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
  onRemoveUserRole: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    availableRoles: state.roles
  };
};

export const LocalizedUserRow = connectLocalization(connect(mapStateToProps)(UserRow));
