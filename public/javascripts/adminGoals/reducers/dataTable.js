import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';
import {
  TABLE_SHOW_PAGE,
  TABLE_SHOW_ERROR,
  CACHE_DASHBOARDS,
  CACHE_USERS
} from '../actionTypes';

export default createReducer(Immutable.fromJS({}), {
  [TABLE_SHOW_PAGE]: (state, action) => state.merge({goals: action.goals}),
  [TABLE_SHOW_ERROR]: (state, action) => state.merge({error: action.error}),
  [CACHE_DASHBOARDS]: (state, action) => state.merge({dashboards: action.dashboards}),
  [CACHE_USERS]: (state, action) => state.merge({users: action.users})
});
