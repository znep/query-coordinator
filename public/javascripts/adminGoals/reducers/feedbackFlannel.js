import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';
import {
  OPEN_FEEDBACK_FLANNEL,
  CLOSE_FEEDBACK_FLANNEL
} from '../actionTypes';

const initialState = { visible: false };

const openFeedbackFlannel = (state, action) => state.merge({ visible: true, hoverable: action.hoverable });

const closeFeedbackFlannel = state => state.merge({ visible: false, hoverable: null });

export default createReducer(Immutable.fromJS(initialState), {
  [OPEN_FEEDBACK_FLANNEL]: openFeedbackFlannel,
  [CLOSE_FEEDBACK_FLANNEL]: closeFeedbackFlannel
});
