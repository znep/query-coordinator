import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';
import {
  TABLE_SHOW_PAGE,
  SHOW_ALERT,
  HIDE_ALERT,
  CACHE_DASHBOARDS,
  CACHE_USERS,
  TABLE_ROW_SELECTED,
  TABLE_ROW_DESELECTED,
  TABLE_ROW_ALL_SELECTION_TOGGLE
} from '../actionTypes';

export default createReducer(Immutable.fromJS({}), {
  // Sets goals list for, this list will be shown on table
  [TABLE_SHOW_PAGE]: (state, action) => state.merge({goals: action.goals}),
  // Triggers alert display on table
  [SHOW_ALERT]: (state, action) => state.merge(_.omit(action, 'type')),
  [HIDE_ALERT]: state => state.merge({alert: {}}),
  // Using state to store cached values for dashboards and users.
  [CACHE_DASHBOARDS]: (state, action) => state.merge({dashboards: action.dashboards}),
  [CACHE_USERS]: (state, action) => state.merge({users: action.users}),
  [TABLE_ROW_SELECTED]: (state, action) => state.updateIn(['selectedRows'], list => list.push(action.goalId)),
  [TABLE_ROW_DESELECTED]: (state, action) => state.updateIn(['selectedRows'],
    list => list.delete(list.indexOf(action.goalId))), // eslint-disable-line dot-notation
  [TABLE_ROW_ALL_SELECTION_TOGGLE]: state => state.get('selectedRows').size == state.get('goals').size ?
    state.set('selectedRows', new Immutable.List) :
    state.set('selectedRows', state.get('goals').map(goal => goal.get('id')))
});
