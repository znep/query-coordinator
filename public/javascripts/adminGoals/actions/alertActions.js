import {
  SHOW_ALERT,
  HIDE_ALERT
} from '../actionTypes';

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
