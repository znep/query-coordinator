import { keyIn } from './lib/utils';
import { getIdFromRole, roleHasError, roleIsNew, validateRole } from './adminRolesSelectors';
import property from 'lodash/fp/property';
import partition from 'lodash/fp/partition';
import CoreApi from 'common/core-roles-api';
import { types as NotificationTypes } from 'common/components/ToastNotification';
import Immutable from 'immutable';

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

export const SAVE_ROLES_START = 'SAVE_ROLES_START';
export const saveRolesStart = roles => ({ type: SAVE_ROLES_START, payload: { roles } });
export const SAVE_ROLES_SUCCESS = 'SAVE_ROLES_SUCCESS';
export const saveRolesSuccess = successes => ({ type: SAVE_ROLES_SUCCESS, payload: { successes } });
export const SAVE_ROLES_FAILURE = 'SAVE_ROLES_FAILURE';
export const saveRolesFailure = () => ({ type: SAVE_ROLES_FAILURE, error: true });

export const saveRoles = roles => dispatch => {
  dispatch(saveRolesStart(roles));
  Promise.all(
    roles
      .map(role =>
        (roleIsNew(role)
          ? CoreApi.createRole(role.filter(keyIn('name', 'rights')).toJS())
          : CoreApi.updateRole(getIdFromRole(role), role.filter(keyIn('name', 'rights')).toJS())
        )
          .then(success => ({ role, success }))
          .catch(err => err.json().then(error => ({ role, error })))
      )
      .toJS()
  )
    .then(responses => {
      const [successes, errors] = partition(property('success'), responses);
      if (errors.length === 0) {
        dispatch(
          showNotification(NotificationTypes.SUCCESS, 'screens.admin.roles.alerts.save_roles.success_html')
        );
        dispatch(saveRolesSuccess(successes));
      } else {
        dispatch(
          showNotification(NotificationTypes.ERROR, 'screens.admin.roles.alerts.save_roles.error_html', {
            error: errors.map(({ error }) => error.message).join('\n')
          })
        );
        dispatch(saveRolesFailure());
      }
    })
    .catch((...args) => console.error(args));
};

export const CREATE_NEW_ROLE_START = 'CREATE_NEW_ROLE_START';
export const CREATE_NEW_ROLE_CANCEL = 'CREATE_NEW_ROLE_CANCEL';
export const createNewRoleStart = () => ({ type: CREATE_NEW_ROLE_START });
export const createNewRoleCancel = () => ({ type: CREATE_NEW_ROLE_CANCEL });

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

export const DELETE_ROLE_START = 'DELETE_ROLE_START';
export const deleteRoleStart = role => ({ type: DELETE_ROLE_START, payload: { role } });
export const DELETE_ROLE_END = 'DELETE_ROLE_END';
export const deleteRoleEnd = () => ({ type: DELETE_ROLE_END });
export const DELETE_ROLE_CANCEL = 'DELETE_ROLE_CANCEL';
export const deleteRoleCancel = () => ({ type: DELETE_ROLE_CANCEL });
export const deleteRole = role => dispatch => {
  if (window.confirm('Are you sure?')) {
    dispatch(deleteRoleStart(role));

    CoreApi.deleteRole(getIdFromRole(role))
      .then(() => {
        dispatch(
          showNotification(NotificationTypes.SUCCESS, 'screens.admin.roles.alerts.delete_role.success_html')
        );
        dispatch(deleteRoleEnd());
      })
      .catch(() => {
        dispatch(
          showNotification(NotificationTypes.ERROR, 'screens.admin.roles.alerts.delete_role.error_html')
        );
        dispatch(deleteRoleCancel());
      });
  } else {
    dispatch(deleteRoleCancel());
  }
};

export const EDIT_ROLE_START = 'EDIT_ROLE_START';
export const editRoleStart = role => ({ type: EDIT_ROLE_START, payload: { role } });

export const RENAME_ROLE_START = 'RENAME_ROLE_START';
export const renameRoleStart = role => ({ type: RENAME_ROLE_START, payload: { role } });
export const renameRoleEnd = (maxCharacterCount, role) => dispatch => {
  const validatedRole = validateRole(maxCharacterCount, role);
  if (roleHasError(validatedRole)) {
    return dispatch(renameRoleStart(validatedRole));
  } else {
    return dispatch(saveRoles(Immutable.fromJS([validatedRole])));
  }
};

export const LOAD_DATA_START = 'LOAD_DATA_START';
export const loadDataStart = () => ({ type: LOAD_DATA_START });
export const LOAD_DATA_SUCCESS = 'LOAD_DATA_SUCCESS';
export const loadDataSuccess = data => ({ type: LOAD_DATA_SUCCESS, payload: { data } });
export const LOAD_DATA_FAILURE = 'LOAD_DATA_FAILURE';
export const loadDataFailure = () => ({ type: LOAD_DATA_FAILURE, error: true });
export const loadData = () => dispatch => {
  dispatch(loadDataStart());

  Promise.all([CoreApi.getAllRights(), CoreApi.getAllRoles()])
    .then(([rightCategories, roles]) => ({ rightCategories, roles }))
    .then(data => dispatch(loadDataSuccess(data)))
    .catch(arg => {
      console.error(arg);
      dispatch(showNotification(NotificationTypes.ERROR, 'screens.admin.roles.alerts.load_data.error_html'));
      dispatch(loadDataFailure());
    });
};

export const SHOW_NOTIFICATION_START = 'SHOW_NOTIFICATION_START';
export const showNotificationStart = (type, content, options = {}) => ({
  type: SHOW_NOTIFICATION_START,
  payload: { type, content, ...options }
});
export const SHOW_NOTIFICATION_END = 'SHOW_NOTIFICATION_END';
export const showNotificationEnd = () => ({ type: SHOW_NOTIFICATION_END });
export const showNotification = (type, content, options = {}) => dispatch => {
  dispatch(showNotificationStart(type, content, options));
  setTimeout(() => dispatch(showNotificationEnd()), 2500);
};

export const HOVER_ROW = 'HOVER_ROW';
export const UNHOVER_ROW = 'UNHOVER_ROW';
export const hoverRow = name => ({ type: HOVER_ROW, payload: { name } });
export const unhoverRow = name => ({ type: UNHOVER_ROW, payload: { name } });
