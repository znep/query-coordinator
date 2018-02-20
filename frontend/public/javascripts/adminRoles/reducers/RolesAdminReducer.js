import Immutable from 'immutable';
import find from 'lodash/fp/find';
import get from 'lodash/fp/get';
import isEmpty from 'lodash/fp/isEmpty';

import * as actions from '../actions';
import * as selectors from '../adminRolesSelectors';
import * as appStates from '../appStates';

export default () => {
  function toggleExpanded(state, { payload: { rightCategory } }) {
    return selectors.updateRightCategoryInState(state, rightCategory, selectors.toggleRightCategoryExpanded);
  }

  function newCustomRole(state) {
    return selectors
      .clearNewRole(state)
      .set('previousState', state.has('previousState') ? state.get('previousState') : state)
      .set('appState', appStates.NEW_CUSTOM_ROLE);
  }

  function editCustomRoleModalCancel(state) {
    return state.get('previousState').delete('previousState');
  }

  function createNewRole(state) {
    const appState = selectors.getAppState(state);
    const editingRole = selectors.getEditingRoleFromState(state);
    const templateRole = selectors.findRoleById(state, selectors.getEditingRoleTemplateIdFromState(state));
    const name = selectors.getRoleNameFromRole(editingRole).trim();

    if (appState === appStates.NEW_CUSTOM_ROLE) {
      const newRole = Immutable.fromJS({
        id: name,
        name,
        isDefault: false,
        userCount: 0,
        rights: isEmpty(templateRole) ? [] : selectors.getRightsFromRole(templateRole).toJS()
      });

      return selectors
        .clearNewRole(state)
        .set('appState', appStates.EDIT_CUSTOM_ROLES)
        .set('scrollToNewRole', selectors.getIdFromRole(newRole))
        .update('roles', roles => roles.push(newRole));
    } else {
      return selectors
        .clearNewRole(state)
        .set('appState', appStates.DEFAULT)
        .update('roles', roles =>
          roles.map(role => (role.get('id') === editingRole.get('id') ? editingRole : role))
        );
    }
  }

  function editCustomRolesCancel(state) {
    return state.get('previousState');
  }

  function editCustomRolesStart(state) {
    return state
      .set('appState', appStates.EDIT_CUSTOM_ROLES)
      .set('previousState', state.delete('previousState'));
  }

  function editCustomRolesEnd(state) {
    return state
      .set('appState', appStates.DEFAULT)
      .delete('previousState')
      .delete('editingRole');
  }

  function changeNewRoleName(state, { payload: { name } }) {
    return state.update('editingRole', x => x.merge({ name, hasError: false, error: null }));
  }

  function changeNewRoleTemplate(state, { payload: { value } }) {
    return state.update('editingRole', x => x.merge({ template: value, hasError: false, error: null }));
  }

  function toggleRoleRight(state, { payload: { role, right } }) {
    const updatedRole = selectors.roleHasRight(role, right)
      ? selectors.removeRightFromRole(role, right)
      : selectors.addRightToRole(role, right);

    return state.update('roles', roles => roles.map(r => (r === role ? updatedRole : r)));
  }

  function toggleRoleRightCategoryValue(state, { payload: { role, rightCategory } }) {
    const updatedRole = selectors.roleHasAllRightsInRightCategory(role, rightCategory)
      ? selectors.removeAllRightsInCategoryFromRole(role, rightCategory)
      : selectors.addAllRightsInCategoryToRole(role, rightCategory);

    return state.update('roles', roles => roles.map(r => (r === role ? updatedRole : r)));
  }

  function saveRolesStart(state) {
    return state.delete('scrollToNewRole').set('appState', appStates.SAVING);
  }

  function saveRolesSuccess(state, { payload: { successes } }) {
    const updatedRoles = selectors.getRolesFromState(state).map(r => {
      const savedRole = get(
        'success',
        find(({ role }) => selectors.getIdFromRole(role) === selectors.getIdFromRole(r), successes)
      );
      return savedRole ? r.merge(savedRole) : r;
    });
    return editCustomRolesEnd(state).set('roles', updatedRoles);
  }

  function saveRolesFailure(state) {
    return editCustomRolesEnd(state);
  }

  function deleteRoleStart(state, { payload: { role } }) {
    return state
      .set('previousState', state)
      .set('deletingRole', role)
      .set('appState', appStates.DELETE_INDIVIDUAL_CUSTOM_ROLE);
  }

  function deleteRoleEnd(state) {
    const deletingRole = state.get('deletingRole');
    return state
      .delete('previousState')
      .update('roles', roles => roles.filterNot(role => role === deletingRole))
      .delete('deletingRole')
      .set('appState', appStates.DEFAULT);
  }

  function deleteRoleCancel(state) {
    return state
      .set('previousState', state.delete('previousState'))
      .delete('deletingRole')
      .set('appState', appStates.DEFAULT);
  }

  function startEditRole(state, { payload: { role } }) {
    return state
      .set('previousState', state.delete('previousState'))
      .set('editingRole', role)
      .set('appState', appStates.EDIT_INDIVIDUAL_CUSTOM_ROLE);
  }

  function handleRenameRole(state, { payload: { role } }) {
    return state
      .set('previousState', state.delete('previousState').set('appState', appStates.DEFAULT))
      .set('editingRole', role)
      .set('appState', appStates.RENAME_INDIVIDUAL_CUSTOM_ROLE);
  }

  function startLoadData(state) {
    return state.set('appState', appStates.LOADING);
  }

  function endLoadData(state, { payload: { data } }) {
    return state.merge(data).set('appState', appStates.DEFAULT);
  }

  function loadDataFailure(state) {
    return state.set('appState', appStates.LOAD_DATA_FAILURE);
  }

  function showNotification(state, { payload }) {
    return state.mergeIn(['notification'], {
      showNotification: true,
      ...payload
    });
  }

  function showNotificationEnd(state) {
    return state.delete('notification').setIn(['notification', 'showNotification'], false);
  }

  function hoverRight(state, name) {
    return state.set('hovered', name);
  }

  function unhoverRight(state) {
    return state.set('hovered', undefined);
  }

  return (state, action) => {
    switch (action.type) {
      case actions.EDIT_CUSTOM_ROLES_CANCEL:
        return editCustomRolesCancel(state, action);
      case actions.EDIT_CUSTOM_ROLES_START:
        return editCustomRolesStart(state, action);
      case actions.EDIT_CUSTOM_ROLES_END:
        return editCustomRolesEnd(state, action);

      case actions.TOGGLE_EXPANDED:
        return toggleExpanded(state, action);
      case actions.NEW_CUSTOM_ROLE:
        return newCustomRole(state, action);

      case actions.EDIT_CUSTOM_ROLE_MODAL_CANCEL:
        return editCustomRoleModalCancel(state);

      case actions.CREATE_NEW_ROLE_START:
        return createNewRole(state, action);
      case actions.CHANGE_NEW_ROLE_NAME:
        return changeNewRoleName(state, action);
      case actions.CHANGE_NEW_ROLE_TEMPLATE:
        return changeNewRoleTemplate(state, action);

      case actions.TOGGLE_ROLE_RIGHT_VALUE:
        return toggleRoleRight(state, action);
      case actions.TOGGLE_ROLE_RIGHT_CATEGORY_VALUE:
        return toggleRoleRightCategoryValue(state, action);

      case actions.SAVE_ROLES_START:
        return saveRolesStart(state, action);
      case actions.SAVE_ROLES_SUCCESS:
        return saveRolesSuccess(state, action);
      case actions.SAVE_ROLES_FAILURE:
        return saveRolesFailure(state, action);

      case actions.DELETE_ROLE_START:
        return deleteRoleStart(state, action);
      case actions.DELETE_ROLE_END:
        return deleteRoleEnd(state, action);
      case actions.DELETE_ROLE_CANCEL:
        return deleteRoleCancel(state, action);

      case actions.EDIT_ROLE_START:
        return startEditRole(state, action);

      case actions.RENAME_ROLE:
        return handleRenameRole(state, action);

      case actions.LOAD_DATA_START:
        return startLoadData(state, action);
      case actions.LOAD_DATA_SUCCESS:
        return endLoadData(state, action);
      case actions.LOAD_DATA_FAILURE:
        return loadDataFailure(state, action);

      case actions.SHOW_NOTIFICATION:
        return showNotification(state, action);
      case actions.SHOW_NOTIFICATION_END:
        return showNotificationEnd(state, action);

      case actions.HOVER_ROW:
        return hoverRight(state, action.payload.name);

      case actions.UNHOVER_ROW:
        return unhoverRight(state);

      default:
        return state;
    }
  };
};
