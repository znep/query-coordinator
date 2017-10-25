import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import { Dropdown } from 'common/components';

export class RolePicker extends Component {
  render() {
    const { availableRoles, onRoleChange, roleId } = this.props;
    return (
      <Dropdown
        onSelection={selection => onRoleChange(selection.value)}
        options={availableRoles}
        size="medium"
        value={roleId} />
    );
  }
}

RolePicker.propTypes = {
  availableRoles: PropTypes.arrayOf(PropTypes.object).isRequired,
  roleId: PropTypes.string.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state, { I18n }) => {
  const customRolesExist = state.roles.some(role => !role.isDefault);

  const availableRoles = state.roles.map(role => {
    const title = role.isDefault ? I18n.t(`roles.default_roles.${role.name}.name`) : role.name;
    if (customRolesExist) {
      const group = role.isDefault ? I18n.t('users.roles.default') : I18n.t('users.roles.custom');
      return {
        title,
        value: role.id,
        group
      };
    } else {
      return {
        title,
        value: role.id
      };
    }
  });

  return {
    availableRoles
  };
};

export const LocalizedRolePicker = connectLocalization(connect(mapStateToProps)(RolePicker));
