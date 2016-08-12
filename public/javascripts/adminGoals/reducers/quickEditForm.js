import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';

import {
  OPEN_GOAL_QUICK_EDIT,
  CLOSE_GOAL_QUICK_EDIT,
  QUICK_EDIT_FAIL,
  QUICK_EDIT_UPDATE_FORM_DATA
} from '../actionTypes';

/**
 * Merge new form data with state.
 * Also create initial form data if nil
 * @param state
 * @param action
 * @returns {*}
 */
const updateFormData = (state, action) => {
  let mergeObject = { formData: action.formData };

  if (state.get('initialFormData').isEmpty()) {
    mergeObject.initialFormData = action.formData;
  }

  return state.merge(mergeObject);
};

/**
 * Set goal id for quick edit.
 * Container App listens for this value to open / close quick edit modal
 * Also defines form data.
 * @param state
 * @param action
 * @return {Immutable.Map}
 */
const openGoalQuickEdit = (state, action) =>
  state.merge({ goalId: action.goalId, initialFormData: {}, formData: {}, showFailureMessage: false });

/**
 * Close quick edit modal by setting goal to null.
 * Also defines empties form data
 * @param state
 * @return {Immutable.Map}
 */
const closeGoalQuickEdit = state => state.merge({ goalId: null, initialFormData: null, formData: null });

/**
 * Show error message on quick edit modal
 * @param state
 * @return {Immutable.Map}
 */
const showFailureMessage = state => state.merge({ showFailureMessage: true });

export default createReducer(new Immutable.Map, {
  [OPEN_GOAL_QUICK_EDIT]: openGoalQuickEdit,
  [CLOSE_GOAL_QUICK_EDIT]: closeGoalQuickEdit,
  [QUICK_EDIT_FAIL]: showFailureMessage,
  [QUICK_EDIT_UPDATE_FORM_DATA]: updateFormData
});
