import { keyIn, makeActionCreator } from './lib/utils';
import { getIdFromRole, roleHasError, roleIsNew, validateRole } from './selectors';
import property from 'lodash/fp/property';
import partition from 'lodash/fp/partition';
import CoreApi from 'common/core-roles-api';
import { types as NotificationTypes } from 'common/components/ToastNotification';
import Immutable from 'immutable';

export const editCustomRoles = makeActionCreator('edit_custom_roles', {
  stages: ['start', 'end', 'cancel']
});

export const newCustomRole = makeActionCreator('new_custom_role');

export const saveRoles = makeActionCreator('save_roles', {
  asyncFunc: (stages, payload) => dispatch => {
    dispatch(stages.start(payload));
    const { roles } = payload;
    Promise.all(
      roles
        .map(role =>
          (roleIsNew(role)
            ? CoreApi.createRole(role.filter(keyIn('name', 'rights')).toJS())
            : CoreApi.updateRole(getIdFromRole(role), role.filter(keyIn('name', 'rights')).toJS()))
            .then(success => ({ role, success }))
            .catch(err => err.json().then(error => ({ role, error })))
        )
        .toJS()
    )
      .then(responses => {
        const [successes, errors] = partition(property('success'), responses);
        if (errors.length === 0) {
          dispatch(
            showNotification({
              type: NotificationTypes.SUCCESS,
              content: 'screens.admin.roles.alerts.save_roles.success_html'
            })
          );
          dispatch(stages.success({ successes }));
        } else {
          dispatch(
            showNotification({
              type: NotificationTypes.ERROR,
              content: 'screens.admin.roles.alerts.save_roles.error_html',
              error: errors.map(({ error }) => error.message).join('\n')
            })
          );
          dispatch(stages.failure());
        }
      })
      .catch((...args) => console.error(args));
  }
});

export const toggleExpanded = makeActionCreator('toggle_expanded');

export const createNewRole = makeActionCreator('create_new_role', {
  stages: ['start', 'cancel']
});

export const changeNewRoleName = makeActionCreator('change_new_role_name');

export const changeNewRoleTemplate = makeActionCreator('change_new_role_template');

export const toggleRoleRightValue = makeActionCreator('toggle_role_right_value');
export const toggleRoleRightCategoryValue = makeActionCreator('toggle_role_right_category_value');

export const deleteRole = makeActionCreator('delete_role', {
  stages: ['start', 'end', 'cancel'],
  asyncFunc: (stages, payload) => dispatch => {
    const { role } = payload;

    if (window.confirm('Are you sure?')) {
      dispatch(stages.start(payload));

      CoreApi.deleteRole(getIdFromRole(role))
        .then(() => {
          dispatch(
            showNotification({
              type: NotificationTypes.SUCCESS,
              content: 'screens.admin.roles.alerts.delete_role.success_html'
            })
          );
          dispatch(stages.end());
        })
        .catch(() => {
          dispatch(
            showNotification({
              type: NotificationTypes.ERROR,
              content: 'screens.admin.roles.alerts.delete_role.error_html'
            })
          );
          dispatch(stages.cancel());
        });
    } else {
      dispatch(stages.cancel());
    }
  }
});

export const startEditRole = makeActionCreator('start_edit_role');
export const startRenameRole = makeActionCreator('start_rename_role');
export const endRenameRole = makeActionCreator('end_rename_role', {
  asyncFunc: (stages, payload) => dispatch => {
    const { role, maxCharacterCount } = payload;
    const validatedRole = validateRole(maxCharacterCount, role);
    if (roleHasError(validatedRole)) {
      return dispatch(startRenameRole({ role: validatedRole }));
    } else {
      return dispatch(saveRoles({ roles: Immutable.fromJS([validatedRole]) }));
    }
  }
});

export const loadData = makeActionCreator('load_data', {
  asyncFunc: stages => dispatch => {
    dispatch(stages.start());

    Promise.all([CoreApi.getAllRights(), CoreApi.getAllRoles()])
      .then(([rightCategories, roles]) => ({ rightCategories, roles }))
      .then(data => dispatch(stages.success({ data })))
      .catch(arg => {
        console.error(arg);
        dispatch(
          showNotification({
            type: NotificationTypes.ERROR,
            content: 'screens.admin.roles.alerts.load_data.error_html'
          })
        );
        dispatch(stages.failure());
      });
  }
});

export const showNotification = makeActionCreator('show_notification', {
  stages: ['start', 'end'],
  asyncFunc: (stages, payload) => dispatch => {
    dispatch(stages.start(payload));
    setTimeout(() => dispatch(stages.end()), 2500);
  }
});

export const hoverRow = makeActionCreator('hover_row');
export const unhoverRow = makeActionCreator('unhover_row');
