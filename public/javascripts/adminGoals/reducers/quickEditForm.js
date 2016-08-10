import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';

import {
  OPEN_GOAL_QUICK_EDIT,
  CLOSE_GOAL_QUICK_EDIT,
  QUICK_EDIT_FAIL,
  QUICK_EDIT_UNSAVED_CHANGES
} from '../actionTypes';

export default createReducer(new Immutable.Map, {
  [OPEN_GOAL_QUICK_EDIT]: (state, action) => state.merge({ goalId: action.goalId, unsavedChanges: false }),
  [CLOSE_GOAL_QUICK_EDIT]: state => state.merge({ goalId: null }),
  [QUICK_EDIT_FAIL]: state => state.merge({ showFailureMessage: true }),
  [QUICK_EDIT_UNSAVED_CHANGES]: state => state.merge({ unsavedChanges: true })
});
