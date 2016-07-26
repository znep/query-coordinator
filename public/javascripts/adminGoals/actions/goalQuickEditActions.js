import 'whatwg-fetch';
import { fetchOptions } from '../constants';

import {
  OPEN_GOAL_QUICK_EDIT,
  CLOSE_GOAL_QUICK_EDIT,
  REMOVE_GOAL_FROM_CACHE
} from '../actionTypes';

import { displayGoalQuickEditAlert } from './alertActions';
import { tableLoadPage } from './goalTableActions';

export function openGoalQuickEdit(goalId) {
  return {
    type: OPEN_GOAL_QUICK_EDIT,
    goalId
  };
}

export function closeGoalQuickEdit() {
  return {
    type: CLOSE_GOAL_QUICK_EDIT
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
          dispatch(displayGoalQuickEditAlert({ label: 'error' }));
        } else {
          dispatch(closeGoalQuickEdit());
          dispatch(removeFromCache(goalId));
          dispatch(tableLoadPage());
        }
      }).
      catch(() => dispatch(displayGoalQuickEditAlert({ label: 'error' })));// eslint-disable-line dot-notation
  };
}

export function removeFromCache(goalId) {
  return {
    type: REMOVE_GOAL_FROM_CACHE,
    goalId
  };
}
