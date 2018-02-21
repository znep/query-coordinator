import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { customConnect, I18nPropType } from 'common/connectUtils';
import { Dropdown } from 'common/components';
import * as Selectors from '../../selectors';

export class TeamRolePicker extends Component {
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
  const teamRoles = Selectors.getTeamRoles(state);

  return {
    availableRoles: teamRoles.map(role => ({ title: I18n.t(`users.team_roles.${role}`), value: role }))
  };
};

export default customConnect({ mapStateToProps })(TeamRolePicker);
