import { types as NotificationTypes } from 'common/components/ToastNotification';

export const EDIT_CUSTOM_ROLES_START = 'EDIT_CUSTOM_ROLES_START';
export const EDIT_CUSTOM_ROLES_END = 'EDIT_CUSTOM_ROLES_END';
export const EDIT_CUSTOM_ROLES_CANCEL = 'EDIT_CUSTOM_ROLES_CANCEL';
export const editCustomRolesStart = () => ({ type: EDIT_CUSTOM_ROLES_START });
export const editCustomRolesEnd = () => ({ type: EDIT_CUSTOM_ROLES_END });
export const editCustomRolesCancel = () => ({ type: EDIT_CUSTOM_ROLES_CANCEL });

export const NEW_CUSTOM_ROLE = 'NEW_CUSTOM_ROLE';
export const newCustomRole = () => ({ type: NEW_CUSTOM_ROLE });

export const TOGGLE_EXPANDED = 'TOGGLE_EXPANDED';
export const toggleExpanded = rightCategory => ({ type: TOGGLE_EXPANDED, payload: { rightCategory } });

export const SAVE_ROLES = 'SAVE_ROLES';
export const saveRoles = roles => ({ type: SAVE_ROLES, payload: { roles } });
export const SAVE_ROLES_START = 'SAVE_ROLES_START';
export const saveRolesStart = () => ({ type: SAVE_ROLES_START });
export const SAVE_ROLES_SUCCESS = 'SAVE_ROLES_SUCCESS';
export const saveRolesSuccess = successes => ({ type: SAVE_ROLES_SUCCESS, payload: { successes } });
export const SAVE_ROLES_FAILURE = 'SAVE_ROLES_FAILURE';
export const saveRolesFailure = () => ({ type: SAVE_ROLES_FAILURE, error: true });

export const CREATE_NEW_ROLE_START = 'CREATE_NEW_ROLE_START';
export const createNewRoleStart = () => ({ type: CREATE_NEW_ROLE_START });

export const EDIT_CUSTOM_ROLE_MODAL_SUBMIT = 'EDIT_CUSTOM_ROLE_MODAL_SUBMIT';
export const editCustomRoleModalSubmit = () => ({ type: EDIT_CUSTOM_ROLE_MODAL_SUBMIT });

export const EDIT_CUSTOM_ROLE_MODAL_CANCEL = 'EDIT_CUSTOM_ROLE_MODAL_CANCEL';
export const editCustomRoleModalCancel = () => ({ type: EDIT_CUSTOM_ROLE_MODAL_CANCEL });

export const CHANGE_NEW_ROLE_NAME = 'CHANGE_NEW_ROLE_NAME';
export const changeNewRoleName = name => ({ type: CHANGE_NEW_ROLE_NAME, payload: { name } });

export const CHANGE_NEW_ROLE_TEMPLATE = 'CHANGE_NEW_ROLE_TEMPLATE';
export const changeNewRoleTemplate = value => ({ type: CHANGE_NEW_ROLE_TEMPLATE, payload: { value } });

export const TOGGLE_ROLE_RIGHT_VALUE = 'TOGGLE_ROLE_RIGHT_VALUE';
export const toggleRoleRightValue = (role, right) => ({
  type: TOGGLE_ROLE_RIGHT_VALUE,
  payload: { role, right }
});

export const TOGGLE_ROLE_RIGHT_CATEGORY_VALUE = 'TOGGLE_ROLE_RIGHT_CATEGORY_VALUE';
export const toggleRoleRightCategoryValue = (role, rightCategory) => ({
  type: TOGGLE_ROLE_RIGHT_CATEGORY_VALUE,
  payload: { role, rightCategory }
});

export const DELETE_ROLE = 'DELETE_ROLE';
export const deleteRole = role => ({ type: DELETE_ROLE, payload: { role } });
export const DELETE_ROLE_START = 'DELETE_ROLE_START';
export const deleteRoleStart = role => ({ type: DELETE_ROLE_START, payload: { role } });
export const DELETE_ROLE_END = 'DELETE_ROLE_END';
export const deleteRoleEnd = () => ({ type: DELETE_ROLE_END });
export const DELETE_ROLE_CANCEL = 'DELETE_ROLE_CANCEL';
export const deleteRoleCancel = () => ({ type: DELETE_ROLE_CANCEL });

export const EDIT_ROLE_START = 'EDIT_ROLE_START';
export const editRoleStart = role => ({ type: EDIT_ROLE_START, payload: { role } });

export const RENAME_ROLE = 'RENAME_ROLE';
export const renameRole = role => ({ type: RENAME_ROLE, payload: { role } });
export const RENAME_ROLE_END = 'RENAME_ROLE_END';
export const renameRoleEnd = () => ({ type: RENAME_ROLE_END });

export const LOAD_DATA_START = 'LOAD_DATA_START';
export const loadDataStart = () => ({ type: LOAD_DATA_START });
export const LOAD_DATA_SUCCESS = 'LOAD_DATA_SUCCESS';
export const loadDataSuccess = data => ({ type: LOAD_DATA_SUCCESS, payload: { data } });
export const LOAD_DATA_FAILURE = 'LOAD_DATA_FAILURE';
export const loadDataFailure = error => ({ type: LOAD_DATA_FAILURE, error: true, payload: { error } });
export const LOAD_DATA = 'LOAD_DATA';
export const loadData = () => ({ type: LOAD_DATA });

export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const showNotification = (type, content, options = {}) => ({
  type: SHOW_NOTIFICATION,
  payload: { type, content, ...options }
});
export const showNotificationError = (content, options = {}) =>
  showNotification(NotificationTypes.ERROR, content, options);
export const showNotificationSuccess = (content, options = {}) =>
  showNotification(NotificationTypes.SUCCESS, content, options);
export const SHOW_NOTIFICATION_END = 'SHOW_NOTIFICATION_END';
export const showNotificationEnd = () => ({ type: SHOW_NOTIFICATION_END });

export const HOVER_ROW = 'HOVER_ROW';
export const UNHOVER_ROW = 'UNHOVER_ROW';
export const hoverRow = name => ({ type: HOVER_ROW, payload: { name } });
export const unhoverRow = name => ({ type: UNHOVER_ROW, payload: { name } });
