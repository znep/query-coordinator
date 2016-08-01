import 'whatwg-fetch';
import { fetchOptions } from '../constants';

import {
  OPEN_GOAL_QUICK_EDIT,
  CLOSE_GOAL_QUICK_EDIT,
  REMOVE_GOAL_FROM_CACHE,
  QUICK_EDIT_SUCCESS,
  QUICK_EDIT_FAIL,
  QUICK_EDIT_UNSAVED_CHANGES
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

export function saveGoalQuickEdit(goalId, version, values) {
  return dispatch => {
    let sendUpdateRequest = () => {
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

    let checkXhrStatus = response => {
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
          dispatch(goalQuickEditUpdateFailed());
        } else {
          dispatch(dismissModal());
          dispatch(removeFromCache(goalId));
          dispatch(tableLoadPage());
          dispatch(quickEditSuccess(values.name));
        }
      }).
      catch(() => { // eslint-disable-line dot-notation
        dispatch(goalQuickEditUpdateFailed());
      });
  };
}

export function removeFromCache(goalId) {
  return {
    type: REMOVE_GOAL_FROM_CACHE,
    goalId
  };
}

export function unsavedChanges() {
  return {
    type: QUICK_EDIT_UNSAVED_CHANGES
  };
}
