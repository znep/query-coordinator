import api from '../api/api';

import { updateCachedGoals } from './goalTableActions';

import {
  SET_MULTIPLE_ITEMS_VISIBILITY,
  REVERT_MULTIPLE_ITEMS_VISIBILITY,
  OPEN_EDIT_MULTIPLE_ITEMS_MODAL,
  CLOSE_EDIT_MULTIPLE_ITEMS_MODAL,
  UPDATE_MULTIPLE_ITEMS_STARTED,
  UPDATE_MULTIPLE_ITEMS_SUCCESS,
  UPDATE_MULTIPLE_ITEMS_FAILED
} from '../actionTypes';

export function setMultipleItemsVisibility(visibility) {
  return {
    type: SET_MULTIPLE_ITEMS_VISIBILITY,
    visibility
  };
}

export function revertMultipleItemsVisibility() {
  return {
    type: REVERT_MULTIPLE_ITEMS_VISIBILITY
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
    goalIds
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

export function updateMultipleGoals(goals, updatedData) {
  const goalIds = goals.map(goal => goal.get('id'));

  return (dispatch) => {
    dispatch(updateMultipleItemsStarted(goalIds));

    const updateRequests = goals.map(goal => api.goals.update(goal.get('id'), goal.get('version'), updatedData));
    return Promise.all(updateRequests)
      .then(updatedGoals => {
        dispatch(updateCachedGoals(updatedGoals));
        dispatch(updateMultipleItemsSucceeded(updatedGoals.map(goal => goal.id)));
        return updatedGoals;
      })
      .catch(err => dispatch(updateMultipleItemsFailed(err)));
  };
}
