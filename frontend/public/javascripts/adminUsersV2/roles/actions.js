export const CHANGE_USER_ROLE = 'CHANGE_USER_ROLE';
export const CHANGE_USER_ROLE_SUCCESS = 'CHANGE_USER_ROLE_SUCCESS';
export const CHANGE_USER_ROLE_FAILURE = 'CHANGE_USER_ROLE_FAILURE';
export const changeUserRole = (userId, newRole) => ({ type: CHANGE_USER_ROLE, payload: { userId, newRole } });
export const changeUserRoleSuccess = (userId, newRole, newRoleName) => ({
  type: CHANGE_USER_ROLE_SUCCESS,
  payload: { userId, newRole, newRoleName }
});
export const changeUserRoleFailure = (userId, error) => ({
  type: CHANGE_USER_ROLE_FAILURE,
  error: true,
  payload: { userId, error }
});

export const LOAD_ROLES = 'LOAD_ROLES';
export const LOAD_ROLES_SUCCESS = 'LOAD_ROLES_SUCCESS';
export const LOAD_ROLES_FAILURE = 'LOAD_ROLES_FAILURE';
export const loadRoles = () => ({ type: LOAD_ROLES });
export const loadRolesSuccess = roles => ({ type: LOAD_ROLES_SUCCESS, payload: { roles } });
export const loadRolesFailure = error => ({ type: LOAD_ROLES_FAILURE, error: true, payload: { error } });

export const REMOVE_USER_ROLE = 'REMOVE_USER_ROLE';
export const REMOVE_USER_ROLE_SUCCESS = 'REMOVE_USER_ROLE_SUCCESS';
export const REMOVE_USER_ROLE_FAILURE = 'REMOVE_USER_ROLE_FAILURE';
export const removeUserRole = (userId, roleId) => ({ type: REMOVE_USER_ROLE, payload: { userId, roleId } });
export const removeUserRoleSuccess = (userId, formerRoleId) => ({
  type: REMOVE_USER_ROLE_SUCCESS,
  payload: { userId, formerRoleId }
});
export const removeUserRoleFailure = (userId, error) => ({
  type: REMOVE_USER_ROLE_FAILURE,
  error: true,
  payload: { userId, error }
});

export const CHANGE_USER_ROLE_FILTER = 'CHANGE_USER_ROLE_FILTER';
export const changeUserRoleFilter = roleId => ({ type: CHANGE_USER_ROLE_FILTER, payload: { roleId } });
