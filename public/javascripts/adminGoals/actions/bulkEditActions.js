import api from '../api/api';

import { updateCachedGoals } from './goalTableActions';

import {
  OPEN_EDIT_MULTIPLE_ITEMS_MODAL,
  CLOSE_EDIT_MULTIPLE_ITEMS_MODAL,
  UPDATE_MULTIPLE_ITEMS_FORM_DATA,
  UPDATE_MULTIPLE_ITEMS_STARTED,
  UPDATE_MULTIPLE_ITEMS_SUCCESS,
  UPDATE_MULTIPLE_ITEMS_FAILED
} from '../actionTypes';

/**
 * Updates multiple items modal form data. Given data
 * should only include goal data fields.
 *
 * @param {Object} newData Goal data known by the form
 */
export function updateMultipleItemsFormData(newData) {
  return {
    type: UPDATE_MULTIPLE_ITEMS_FORM_DATA,
    newData
  };
}

export function closeEditMultipleItemsModal() {
  return {
    type: CLOSE_EDIT_MULTIPLE_ITEMS_MODAL
  };
}

function updateMultipleItemsStarted(goalIds) {
  return {
    type: UPDATE_MULTIPLE_ITEMS_STARTED,
    goalIds
  };
}

function updateMultipleItemsSucceeded(goalIds) {
  return {
    type: UPDATE_MULTIPLE_ITEMS_SUCCESS,
    goalIds,
    notification: {
      type: 'success',
      message: {
        path: 'admin.bulk_edit.success_message',
        values: [goalIds.length.toString()]
      }
    }
  };
}

function updateMultipleItemsFailed(reason) {
  return {
    type: UPDATE_MULTIPLE_ITEMS_FAILED,
    reason
  };
}

export function openEditMultipleItemsModal() {
  return {
    type: OPEN_EDIT_MULTIPLE_ITEMS_MODAL
  };
}

/**
 * Makes an API request to update given list of goals
 * data.
 *
 * @param {Immutable.List} goals List of goal objects
 * @param {Object} updatedData Updated fields
 */
export function updateMultipleGoals(goals, updatedData) {
  const goalIds = goals.map(goal => goal.get('id'));

  return (dispatch) => {
    dispatch(updateMultipleItemsStarted(goalIds));

    const updateRequests = goals.map(goal => api.goals.update(goal.get('id'), goal.get('version'), updatedData));
    return Promise.all(updateRequests).
      then(updatedGoals => {
        dispatch(updateCachedGoals(updatedGoals));
        dispatch(updateMultipleItemsSucceeded(updatedGoals.map(goal => goal.id)));
        return updatedGoals;
      }).catch(err => dispatch(updateMultipleItemsFailed(err))); // eslint-disable-line dot-notation
  };
}
