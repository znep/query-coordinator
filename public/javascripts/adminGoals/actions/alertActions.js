import {
  SHOW_ALERT,
  HIDE_ALERT
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
export function displayAlert(alert) {
  return {
    type: SHOW_ALERT,
    alert
  };
}

export function hideAlert() {
  return {
    type: HIDE_ALERT
  };
}
