import CoreRolesApi from 'common/core-roles-api';
import { showNotification, START, COMPLETE_SUCCESS, COMPLETE_FAIL } from '../actions';
import { GOTO_PAGE, loadUsers } from '../users/actions';
import { getFilters, getUsersOffset, getUsersQuery, getUsersResultsLimit } from '../reducers';

export const USER_ROLE_CHANGE = 'USER_ROLE_CHANGE';
export const changeUserRole = (userId, newRole) => dispatch => {
  const ACTION = {
    type: USER_ROLE_CHANGE,
    userId,
    newRole
  };

  dispatch({ ...ACTION, stage: START });
  return CoreRolesApi.assignRoleToUser(userId, newRole).then(
    () => {
      dispatch({ ...ACTION, stage: COMPLETE_SUCCESS });
      dispatch(showNotification({ translationKey: 'users.notifications.role_changed' }, 'success'));
    },
    err => {
      console.error(err);
      dispatch({ ...ACTION, stage: COMPLETE_FAIL });
      if (err.status === 400) {
        err.json().then(data => {
          if (data.message === 'Cannot change your own role') {
            dispatch(showNotification({ translationKey: 'users.errors.own_role' }, 'error'));
          } else {
            dispatch(showNotification({ translationKey: 'users.errors.unknown' }, 'error'));
          }
        });
      }
    }
  );
};

export const loadRoles = () => {
  return CoreRolesApi.getAllRoles().then(roles =>
    roles.
      map(({ name, id, isDefault }) => {
        return {
          name,
          id: id.toString(),
          isDefault
        };
      }).
      sort((a, b) => {
        if (a.isDefault === b.isDefault) {
          if (a.name < b.name) {
            return -1;
          } else if (a.name > b.name) {
            return 1;
          } else {
            return 0;
          }
        } else {
          return a.isDefault ? -1 : 1;
        }
      })
  );
};

export const removeUserRole = (userId, roleId) => dispatch => {
  const ACTION = {
    type: USER_ROLE_CHANGE,
    userId,
    newRole: 'none'
  };

  dispatch({ ...ACTION, stage: START });
  CoreRolesApi.removeRoleFromUser({ userId, roleId }).then(
    () => {
      dispatch({ ...ACTION, stage: COMPLETE_SUCCESS });
      dispatch(showNotification({ translationKey: 'users.notifications.role_removed' }, 'success'));
    },
    err => {
      console.error(err);
      dispatch({ ...ACTION, stage: COMPLETE_FAIL });
      if (err.status === 400) {
        err.json().then(data => {
          if (data.message === 'Cannot change your own role') {
            dispatch(showNotification({ translationKey: 'users.errors.own_role' }, 'error'));
          } else {
            dispatch(showNotification({ translationKey: 'users.errors.unknown' }, 'error'));
          }
        });
      }
    }
  );
};

export const ROLE_FILTER_CHANGED = 'ROLE_FILTER_CHANGED';
export const roleFilterChanged = roleId => (dispatch, getState) => {
  dispatch({ type: ROLE_FILTER_CHANGED, stage: START, roleId });
  dispatch({ type: GOTO_PAGE, payload: { page: 1 }});
  const state = getState();
  const filters = getFilters(state);
  const offset = getUsersOffset(state);
  const limit = getUsersResultsLimit(state);
  const query = getUsersQuery(state);
  return loadUsers({ filters, limit, offset, query }).then(results => {
    dispatch({ type: ROLE_FILTER_CHANGED, stage: COMPLETE_SUCCESS, users: results, roleId });
  });
};
