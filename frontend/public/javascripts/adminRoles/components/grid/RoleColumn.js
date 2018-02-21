import cond from 'lodash/fp/cond';
import constant from 'lodash/fp/constant';
import stubTrue from 'lodash/fp/stubTrue';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { customConnect, I18nPropType } from 'common/connectUtils';

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
    I18n: I18nPropType,
    editingRole: PropTypes.object.isRequired,
    isEditCustomRolesAppState: PropTypes.bool.isRequired,
    isEditIndividualRoleAppState: PropTypes.bool.isRequired,
    rightCategories: PropTypes.object.isRequired,
    role: PropTypes.object.isRequired
  };

  render() {
    const {
      I18n,
      editingRole,
      isEditCustomRolesAppState,
      isEditIndividualRoleAppState,
      rightCategories,
      role
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

    const roleId = selectors.getIdFromRole(role);
    const roleName = selectors.getRoleNameFromRole(role);
    const roleDisplayName = isDefault
      ? I18n.t(selectors.getRoleNameTranslationKeyPathFromRole(role))
      : roleName;

    const numberOfUsers = selectors.getNumberOfUsersFromRole(role);
    const numberOfInvitedUsers = selectors.getNumberOfInvitedUsersFromRole(role);
    const showNUmberOfInvitedUsers = !isNil(numberOfInvitedUsers) && numberOfInvitedUsers > 0;

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
          <a href={`/admin/users?roleId=${roleId}`}>
            {I18n.t('screens.admin.roles.index_page.grid.user_count', {
              count: numberOfUsers
            })}
          </a>
          {showNUmberOfInvitedUsers &&
            <span>
              {' / '}
              <a href={`/admin/users/invited?roleId=${roleId}`}>
                {`${selectors.getNumberOfInvitedUsersFromRole(role)} ${I18n.t('screens.admin.roles.index_page.grid.invited')}`}
              </a>
            </span>
          }
        </Grid.Cell>
      </Grid.Column>
    );
  }
}

export default customConnect({ mapStateToProps, styles })(RoleColumn);
