import {
  OPEN_FEEDBACK_FLANNEL,
  CLOSE_FEEDBACK_FLANNEL
} from '../actionTypes';

export function openFeedbackFlannel(hoverable) {
  return {
    type: OPEN_FEEDBACK_FLANNEL,
    hoverable
  };
}

export function closeFeedbackFlannel() {
  return {
    type: CLOSE_FEEDBACK_FLANNEL
  };
}
