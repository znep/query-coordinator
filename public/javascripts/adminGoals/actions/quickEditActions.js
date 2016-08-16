import 'whatwg-fetch';
import { fetchOptions } from '../constants';

import {
  OPEN_GOAL_QUICK_EDIT,
  CLOSE_GOAL_QUICK_EDIT,
  REMOVE_GOAL_FROM_CACHE,
  QUICK_EDIT_SUCCESS,
  QUICK_EDIT_FAIL,
  QUICK_EDIT_UPDATE_FORM_DATA
} from '../actionTypes';

import { tableLoadPage } from './goalTableActions';

export function openGoalQuickEdit(goalId) {
  return {
    type: OPEN_GOAL_QUICK_EDIT,
    goalId
  };
}

export function dismissModal() {
  return {
    type: CLOSE_GOAL_QUICK_EDIT
  };
}

export function goalQuickEditUpdateFailed() {
  return {
    type: QUICK_EDIT_FAIL
  };
}

export function quickEditSuccess(goalName) {
  return {
    type: QUICK_EDIT_SUCCESS,
    notification: {
      type: 'success',
      message: {
        path: 'admin.quick_edit.success_message',
        values: [goalName]
      }
    }
  };
}

/**
 * Saves quick edit form to API.
 * Fetches form data from state. Rebuilds data to API format.
 * Sends error message on failure
 * Dispatches necessary actions to reload table row on success
 */
export function saveGoalQuickEdit() {
  return (dispatch, getState) => {
    const state = getState();
    const formData = state.getIn(['quickEditForm', 'formData']);
    const goal = state.getIn(['goalTableData', 'cachedGoals', state.getIn(['quickEditForm', 'goalId'])]);
    const goalId = goal.get('id');
    const version = goal.get('version');
    const values = {
      'is_public': formData.get('visibility') == 'public',
      'name': formData.get('name'),
      'action': formData.get('actionType'),
      'subject': formData.get('prevailingMeasureName'),
      'override': formData.get('prevailingMeasureProgressOverride') == 'none' ?
        '' : formData.get('prevailingMeasureProgressOverride'),
      'unit': formData.get('unit'),
      'delta_is_percent': formData.get('percentUnit') == '%',
      'start': formData.get('startDate') ? formData.get('startDate').format('YYYY-MM-DDT00:00:00.000') : null,
      'end': formData.get('endDate') ? formData.get('endDate').format('YYYY-MM-DDT00:00:00.000') : null,
      'target': formData.get('measureTarget'),
      'target_type': formData.get('measureTargetType'),
      'baseline': formData.get('measureBaseline'),
      'delta': formData.get('measureTargetDelta'),
      'maintain_type': formData.get('measureMaintainType')
    };

    const sendUpdateRequest = () => {
      return fetch(`/stat/api/v2/goals/${goalId}`, _.merge(_.clone(fetchOptions), {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'If-Match': version
        },
        body: JSON.stringify(values)
      })).
        then(checkXhrStatus).
        then(response => response.json());
    };

    const checkXhrStatus = response => {
      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      let error = new Error(response.statusText);
      error.response = response;
      throw error;
    };

    return sendUpdateRequest().
      then(response => {
        if (response.error) {
          dispatch(goalQuickEditUpdateFailed()); // Show error message in quick edit modal
        } else {
          dispatch(dismissModal()); // Close quick edit modal
          dispatch(removeFromCache(goalId)); // Remove goal data from cache
          dispatch(tableLoadPage()); // Reload table
          dispatch(quickEditSuccess(values.name)); // Show success message
        }
      }).
      catch(() => { // eslint-disable-line dot-notation
        dispatch(goalQuickEditUpdateFailed());
      });
  };
}

/**
 * Remove a goal from cache. Causes goal to reload.
 * @param goalId
 * @returns {{type, goalId: *}}
 */
export function removeFromCache(goalId) {
  return {
    type: REMOVE_GOAL_FROM_CACHE,
    goalId
  };
}

/**
 * Dispatches new form data to reducer
 * @param formData
 * @returns {{type, formData: *}}
 */
export function updateFormData(formData) {
  return {
    type: QUICK_EDIT_UPDATE_FORM_DATA,
    formData
  };
}
