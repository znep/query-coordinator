import cond from 'lodash/fp/cond';
import constant from 'lodash/fp/constant';
import stubTrue from 'lodash/fp/stubTrue';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import { connectLocalization } from 'common/components/Localization';

import * as selectors from '../../adminRolesSelectors';
import Grid from '../util/Grid';
import RoleEditControl from './RoleEditControl';
import RoleRightCategory from './RoleRightCategory';
import styles from './roles-grid.module.scss';

const mapStateToProps = state => ({
  editingRole: selectors.getEditingRoleFromState(state),
  isEditCustomRolesAppState: selectors.isEditCustomRolesAppState(state),
  isEditIndividualRoleAppState: selectors.isEditIndividualRoleAppState(state),
  rightCategories: selectors.getRightCategoriesFromState(state)
});

class RoleColumn extends Component {
  static propTypes = {
    editingRole: PropTypes.object.isRequired,
    isEditCustomRolesAppState: PropTypes.bool.isRequired,
    isEditIndividualRoleAppState: PropTypes.bool.isRequired,
    rightCategories: PropTypes.object.isRequired,
    role: PropTypes.object.isRequired
  };

  render() {
    const {
      editingRole,
      isEditCustomRolesAppState,
      isEditIndividualRoleAppState,
      rightCategories,
      role,
      localization: { translate }
    } = this.props;
    const editingThisColumn = selectors.getIdFromRole(role) === selectors.getIdFromRole(editingRole);
    const editingColumn = (isEditIndividualRoleAppState && editingThisColumn) || isEditCustomRolesAppState;

    const isDefault = selectors.roleIsDefault(role);
    const styleName = cond([
      [constant(isDefault), constant('default-role-column')],
      [constant(isEditCustomRolesAppState), constant('edit-custom-role-column')],
      [() => isEditIndividualRoleAppState && editingThisColumn, constant('edit-custom-role-column')],
      [() => isEditIndividualRoleAppState && !editingThisColumn, constant('default-role-column')],
      [stubTrue, constant('custom-role-column')]
    ])();

    const roleName = selectors.getRoleNameFromRole(role);
    const roleDisplayName = isDefault
      ? translate(selectors.getRoleNameTranslationKeyPathFromRole(role))
      : roleName;
    return (
      <Grid.Column styleName={styleName}>
        <Grid.Header styleName="role-header-cell">
          <h6>{roleDisplayName}</h6>
          {isDefault || isEditCustomRolesAppState || isEditIndividualRoleAppState ? null : (
            <RoleEditControl role={role} />
          )}
        </Grid.Header>
        {rightCategories.map(rightCategory => (
          <RoleRightCategory
            key={`${roleName}_${selectors.getTranslationKeyFromRightCategory(rightCategory)}`}
            rightCategory={rightCategory}
            role={role}
            roleName={roleName}
            editingColumn={editingColumn}
            isDefault={isDefault}
          />
        ))}
        <Grid.Cell styleName="role-footer-cell">
          <a href={`/admin/users?roleId=${selectors.getIdFromRole(role)}`}>
            {selectors.getNumberOfUsersFromRole(role)}
          </a>
          {' / '}
          <a href={`/admin/users/invited?roleId=${selectors.getIdFromRole(role)}`}>
            {`${selectors.getNumberOfInvitedUsersFromRole(role)} ${translate('screens.admin.roles.index_page.grid.invited')}`}
          </a>
        </Grid.Cell>
      </Grid.Column>
    );
  }
}

export default connectLocalization(connect(mapStateToProps)(cssModules(RoleColumn, styles)));
