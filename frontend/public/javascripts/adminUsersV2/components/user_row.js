import React, { PropTypes } from 'react';
import { Dropdown, SocrataIcon } from 'common/components';
import _ from 'lodash';

export default class UserRow extends React.Component {

  renderCheckbox() {
    return (
      <td>
        <input
          type="checkbox"
          checked={this.props.isSelected}
          onChange={this.props.onSelectionChange} />
      </td>
    );
  }

  renderDisplayName() {
    return (
      <td>
        <SocrataIcon name="user" />
        <a href={`/profile/${this.props.userId}`}>
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
    return (<td>{this.props.lastActive}</td>);
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
    return (
      <td className="role-picker-cell">
        <Dropdown
          onSelection={(selection) => this.props.onRoleChange(selection.value)}
          options={this.props.availableRoles}
          size="medium"
          value={_.isUndefined(this.props.pendingRole) ?
            this.props.currentRole : this.props.pendingRole} />
            {this.renderPendingActionStatus()}
      </td>
    );
  }

  renderActionMenu() {
    return (
      <td>...</td>
    );
  }

  render() {
    return (
      <tr key={this.props.userId} className="result-list-row" >
        {this.renderCheckbox()}
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
  isSelected: PropTypes.bool.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  screenName: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  lastActive: PropTypes.string.isRequired,
  availableRoles: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentRole: PropTypes.string.isRequired,
  pendingRole: PropTypes.string,
  onRoleChange: PropTypes.func.isRequired
};
