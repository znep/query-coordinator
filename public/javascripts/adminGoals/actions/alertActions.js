import {
  SHOW_GOAL_TABLE_ALERT,
  SHOW_GOAL_QUICK_EDIT_ALERT
} from '../actionTypes';

/**
 * Displays alert messages on the table.
 *
 * Alert format should be { label: '', message: '' }
 * Possible Labels; default | info | success | warning | error
 * Message; html
 *
 * @param alert
 * @returns Object
 */
export function displayGoalTableAlert(alert) {
  return {
    type: SHOW_GOAL_TABLE_ALERT,
    alert
  };
}

export function displayGoalQuickEditAlert(alert) {
  return {
    type: SHOW_GOAL_QUICK_EDIT_ALERT,
    alert
  };
}
