import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';
import {
  TABLE_SHOW_PAGE,
  SHOW_GOAL_TABLE_ALERT,
  SHOW_GOAL_QUICK_EDIT_ALERT,
  CACHE_DASHBOARDS,
  CACHE_USERS,
  CACHE_GOALS,
  TABLE_ROW_SELECTED,
  TABLE_ROW_DESELECTED,
  TABLE_ROW_ALL_SELECTION_TOGGLE,
  ROWS_PER_PAGE_CHANGED,
  SET_TOTAL_GOAL_COUNT,
  SET_CURRENT_PAGE,
  SET_TABLE_ORDER,
  OPEN_GOAL_QUICK_EDIT,
  CLOSE_GOAL_QUICK_EDIT,
  REMOVE_GOAL_FROM_CACHE
} from '../actionTypes';

export default createReducer(Immutable.fromJS({}), {
  // Sets goals list for, this list will be shown on table
  [TABLE_SHOW_PAGE]: (state, action) => state.merge({goals: action.goals}),
  // Triggers alert display on table
  [SHOW_GOAL_TABLE_ALERT]: (state, action) => state.merge(_.omit(action, 'type')),
  [SHOW_GOAL_QUICK_EDIT_ALERT]: (state, action) => state.merge(_.omit(action, 'type')),
  // Using state to store cached values for dashboards and users.
  [CACHE_DASHBOARDS]: (state, action) => state.merge({dashboards: action.dashboards}),
  [CACHE_USERS]: (state, action) => state.merge({users: action.users}),
  [CACHE_GOALS]: (state, action) => state.merge({cachedGoals: action.goals}),
  [TABLE_ROW_SELECTED]: (state, action) => state.updateIn(['selectedRows'], list => list.push(action.goalId)),
  [TABLE_ROW_DESELECTED]: (state, action) => state.updateIn(['selectedRows'],
    list => list.delete(list.indexOf(action.goalId))), // eslint-disable-line dot-notation
  [TABLE_ROW_ALL_SELECTION_TOGGLE]: state => state.get('selectedRows').size == state.get('goals').size ?
    state.set('selectedRows', new Immutable.List) :
    state.set('selectedRows', state.get('goals').map(goal => goal.get('id'))),
  [ROWS_PER_PAGE_CHANGED]: (state, action) => state.set('rowsPerPage', action.value),
  [SET_TOTAL_GOAL_COUNT]: (state, action) => state.set('totalGoalCount', action.count),
  [SET_CURRENT_PAGE]: (state, action) => state.set('currentPage', action.page),
  [SET_TABLE_ORDER]: (state, action) => state.set('tableOrder',
    Immutable.fromJS({ column: action.column, direction: action.direction })),
  [OPEN_GOAL_QUICK_EDIT]: (state, action) => state.merge({goalQuickEditOpenGoalId: action.goalId}),
  [CLOSE_GOAL_QUICK_EDIT]: state => state.merge({goalQuickEditOpenGoalId: null}),
  [REMOVE_GOAL_FROM_CACHE]: (state, action) => state.deleteIn(['cachedGoals', action.goalId])
});
