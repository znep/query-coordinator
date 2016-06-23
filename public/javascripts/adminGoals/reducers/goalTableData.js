import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';
import {
  TABLE_SHOW_PAGE,
  TABLE_SHOW_ERROR,
  CACHE_DASHBOARDS,
  CACHE_USERS
} from '../actionTypes';

/**
 * Sole responsibility of reducers are merging values coming from actions with state-storage
 */
export default createReducer(Immutable.fromJS({}), {
  // Sets goals list for, this list will be shown on table
  [TABLE_SHOW_PAGE]: (state, action) => state.merge({goals: action.goals}),
  // Triggers error display on table
  [TABLE_SHOW_ERROR]: (state, action) => state.merge({error: action.error}),
  // Using state to store cached values for dashboards and users.
  [CACHE_DASHBOARDS]: (state, action) => state.merge({dashboards: action.dashboards}),
  [CACHE_USERS]: (state, action) => state.merge({users: action.users})
});
