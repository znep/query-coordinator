import cond from 'lodash/fp/cond';
import constant from 'lodash/fp/constant';
import curry from 'lodash/fp/curry';
import negate from 'lodash/fp/negate';
import stubFalse from 'lodash/fp/stubFalse';
import stubTrue from 'lodash/fp/stubTrue';
import Immutable from 'immutable';
import * as appStates from './appStates';
import { invert } from './lib/utils';

const sortRoles = (r1, r2) => {
  const r1Default = roleIsDefault(r1);
  const r2Default = roleIsDefault(r2);

  if (r1Default) {
    if (r2Default) {
      return getSortOrderFromRole(r1) - getSortOrderFromRole(r2);
    } else {
      return -1;
    }
  } else {
    if (r2Default) {
      return 1;
    } else {
      return getCreatedAtDateFromRole(r1) - getCreatedAtDateFromRole(r2);
    }
  }
};
export const getSortOrderFromRole = role => role.get('defaultSortOrder', Number.MAX_SAFE_INTEGER);
export const getRolesFromState = state => state.get('roles', Immutable.List()).sort(sortRoles);
export const roleIsDefault = role => role.get('isDefault');
export const roleIsCustom = negate(roleIsDefault);
export const getRightCategoriesFromState = state => state.getIn(['rightCategories'], Immutable.List());
export const getCreatedAtDateFromRole = role => role.get('createdAt', Number.MAX_SAFE_INTEGER);

export const removeRightFromRole = curry((role, right) =>
  role.update('rights', Immutable.List(), rights =>
    rights.filterNot(rightName => rightName === getNameFromRight(right))
  )
);

export const addRightToRole = curry((role, right) =>
  role.update('rights', Immutable.List(), rights => rights.push(getNameFromRight(right)))
);

export const addAllRightsInCategoryToRole = curry((role, category) =>
  role.update('rights', Immutable.List(), rights =>
    rights.toSet().union(getRightNamesFromRightCategory(category)).toList()
  )
);

export const removeAllRightsInCategoryFromRole = curry((role, category) =>
  role.update('rights', Immutable.List(), rights =>
    rights.toSet().subtract(getRightNamesFromRightCategory(category)).toList()
  )
);

export const findRoleById = curry((state, roleId) =>
  getRolesFromState(state).find(role => getIdFromRole(role) === roleId)
);

export const getRoleNameFromRole = role => role.get('name', '');
export const getRoleNameTranslationKeyPathFromRole = role =>
  `roles.default_roles.${getRoleNameFromRole(role)}.name`;
export const getIdFromRole = role => role.get('id');
export const getRightsFromRole = role => role.get('rights', Immutable.List());
export const getNumberOfUsersFromRole = role => role.get('numberOfUsers', 0);

const sortRights = (r1, r2) => {
  return getSortOrderFromRight(r1) - getSortOrderFromRight(r2);
};
export const getSortOrderFromRight = right => right.get('sortOrder', Number.MAX_SAFE_INTEGER);
export const getRightsFromRightCategory = category =>
  category.get('rights', Immutable.List()).sort(sortRights);
export const getRightNamesFromRightCategory = category =>
  getRightsFromRightCategory(category).map(getNameFromRight);
export const getExpandedStateFromRightCategory = category => category.get('isExpanded', false);
export const getTranslationKeyFromRightCategory = category => category.get('translationKey');
export const getTranslationKeyPathFromRightCategory = category =>
  `roles.right_categories.${getTranslationKeyFromRightCategory(category)}.name`;

export const getNameFromRight = right => right.get('name');
export const getNameTranslationKeyPathFromRight = right => `roles.rights.${getNameFromRight(right)}.name`;

export const roleIsNew = role => !role.has('createdAt');
export const roleHasRightByName = curry((role, rightName) => getRightsFromRole(role).includes(rightName));
export const roleHasRight = curry((role, right) => roleHasRightByName(role, getNameFromRight(right)));
export const roleHasAnyRightInRightCategory = curry((role, category) => {
  const roleRights = getRightsFromRole(role);
  return getRightsFromRightCategory(category).some(right => roleRights.includes(getNameFromRight(right)));
});
export const roleHasAllRightsInRightCategory = curry((role, category) => {
  const roleRights = getRightsFromRole(role);
  return getRightsFromRightCategory(category).every(right => roleRights.includes(getNameFromRight(right)));
});

export const rightCategoryStateForRole = curry((role, category) =>
  cond([
    [roleHasAllRightsInRightCategory(role), stubTrue],
    [roleHasAnyRightInRightCategory(role), constant('partial')],
    [stubTrue, stubFalse]
  ])(category)
);

export const getPreviousState = state => state.get('previousState', Immutable.Map());

export const getDirtyRolesFromState = state =>
  getRolesFromState(state).toSet().subtract(getRolesFromState(getPreviousState(state)).toSet()).toList();

export const getEditingRoleFromState = state => state.get('editingRole', Immutable.Map());
export const getEditingRoleTemplateIdFromState = state =>
  getEditingRoleFromState(state).get('template', null);

export const updateRightCategoryInState = curry((state, category, updateFn) =>
  state.update('rightCategories', rightCategories =>
    rightCategories.map(item => (item === category ? updateFn(item) : item))
  )
);
export const toggleRightCategoryExpanded = category => category.update('isExpanded', invert);

export const getAppState = state => state.get('appState');
export const getNotificationFromState = state => state.get('notification', Immutable.Map());

export const getMaxCharacterCountFromState = state => state.get('maxCharacterCount');
export const getFaqUrlFromState = state => state.get('rolesAdminFaqUrl');

export const isEditCustomRolesAppState = state => appStates.EDIT_CUSTOM_ROLES === getAppState(state);
export const isEditIndividualRoleAppState = state =>
  appStates.EDIT_INDIVIDUAL_CUSTOM_ROLE === getAppState(state);
export const stateHasCustomRoles = state => getRolesFromState(state).some(roleIsCustom);

export const configurableRoleFeatureFlagFromState = state =>
  state.getIn(['featureFlags', 'configurable_roles']);

export const updateRoleWithError = curry((error, role) => role.merge({ error, hasError: true }));

export const validateRole = curry((maxCharacterCount, role) => {
  const name = getRoleNameFromRole(role);
  if (name.length === 0) {
    return updateRoleWithError(
      {
        message: 'screens.admin.roles.errors.role_name_empty'
      },
      role
    );
  }

  if (name.length > maxCharacterCount) {
    return updateRoleWithError(
      {
        message: 'screens.admin.roles.errors.role_name_length',
        maxCharacterCount
      },
      role
    );
  }
  return role;
});

export const roleHasError = role => role.get('hasError');

export const scrollToNewRole = state => state.get('scrollToNewRole');

export const clearNewRole = state =>
  state.set(
    'editingRole',
    Immutable.fromJS({
      name: '',
      error: null,
      hasError: false,
      template: null
    })
  );

export const getInitialState = serverConfig =>
  Immutable.fromJS({
    appState: appStates.LOADING,
    maxCharacterCount: 35,
    rightCategories: [],
    roles: []
  }).merge(serverConfig);
