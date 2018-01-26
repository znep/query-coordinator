import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect as fullConnect, I18nPropType } from '../../utils';
import { Dropdown } from 'common/components';
import * as Selectors from '../../selectors';

export class RolePicker extends Component {
  static propTypes = {
    availableRoles: PropTypes.arrayOf(PropTypes.object).isRequired,
    roleId: PropTypes.string,
    onRoleChange: PropTypes.func.isRequired,
    I18n: I18nPropType.isRequired,
    initialOption: PropTypes.object,
    placeholder: PropTypes.string
  };

  render() {
    const { availableRoles, onRoleChange, roleId, initialOption, placeholder } = this.props;

    if (initialOption) {
      availableRoles.unshift(initialOption);
    }

    return (
      <Dropdown
        onSelection={selection => onRoleChange(selection.value)}
        options={availableRoles}
        size="medium"
        value={roleId}
        placeholder={placeholder} />
    );
  }
}

const mapStateToProps = (state, { I18n }) => {
  const roles = Selectors.getRoles(state) || [];
  const customRolesExist = roles.some(role => !role.isDefault);

  const availableRoles = roles.map(role => {
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

export default fullConnect(mapStateToProps)(RolePicker);
