import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getRoleDisplayName } from '../../utils';
import { customConnect, I18nPropType } from 'common/connectUtils';
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
    const title = getRoleDisplayName(role, roles, I18n);
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

export default customConnect({ mapStateToProps })(RolePicker);
