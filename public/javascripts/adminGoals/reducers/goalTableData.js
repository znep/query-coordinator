import _ from 'lodash';
import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';
import {
  TABLE_SHOW_PAGE,
  CACHE_DASHBOARDS,
  CACHE_USERS,
  CACHE_GOALS,
  CACHED_GOALS_UPDATED,
  TABLE_ROW_SELECTED,
  TABLE_ROW_DESELECTED,
  TABLE_ROW_ALL_SELECTION_TOGGLE,
  TABLE_ROW_SELECTION_START,
  TABLE_ROW_SELECTION_END,
  TABLE_ROW_SELECTION_CANCEL,
  ROWS_PER_PAGE_CHANGED,
  SET_TOTAL_GOAL_COUNT,
  SET_CURRENT_PAGE,
  SET_TABLE_ORDER,
  REMOVE_GOAL_FROM_CACHE
} from '../actionTypes';

// TODO: Change this after goals kept in a Map structure
const updateGoals = (state, updatedGoals) => {
  const oldGoals = state.get('goals');
  const goalIds = [];
  const goalsMap = updatedGoals.reduce((map, goal) => {
    map[goal.id] = goal;
    goalIds.push(goal.id);
    return map;
  }, {});

  return oldGoals.map(goal => {
    if (goalIds.indexOf(goal.get('id')) >= 0) {
      return goal.merge(goalsMap[goal.get('id')]);
    }

    return goal;
  });
};

const updateCachedGoals = (state, updatedGoals) => {
  return state.get('cachedGoals').mergeDeep(_.keyBy(updatedGoals, 'id'));
};

const rowSelect = (state, action) => state.updateIn(['selectedRows'], list => list.push(action.goalId));

const rowSelectionStart = (state, action) => state.set('multipleRowSelection', action.goalId);

const rowSelectionEnd = (state, action) => {
  const selectionStartGoalId = state.get('multipleRowSelection');
  const selectionEndGoalId = action.goalId;

  if (selectionStartGoalId && selectionEndGoalId) {
    const index1 = state.get('goals').indexOf(state.getIn(['cachedGoals', selectionStartGoalId]));
    const index2 = state.get('goals').indexOf(state.getIn(['cachedGoals', selectionEndGoalId]));
    const selectionStartIndex = _.min([index1, index2]);
    const selectionEndIndex = _.max([index1, index2]);

    for (let i = selectionStartIndex; i < selectionEndIndex + 1; i++) {
      const goalId = state.getIn(['goals', i, 'id']);
      state = rowSelect(state, { goalId });
    }

    state = rowSelectionCancel(state);
  }

  return state;
};

const rowSelectionCancel = state => state.set('multipleRowSelection', false);

export default createReducer(new Immutable.Map, {
  // Sets goals list for, this list will be shown on table
  [TABLE_SHOW_PAGE]: (state, action) => state.merge({goals: action.goals}),
  // Using state to store cached values for dashboards and users.
  [CACHE_DASHBOARDS]: (state, action) => state.merge({dashboards: action.dashboards}),
  [CACHE_USERS]: (state, action) => state.merge({users: action.users}),
  [CACHE_GOALS]: (state, action) => state.merge({cachedGoals: action.goals}),
  [CACHED_GOALS_UPDATED]: (state, action) => state.merge({
    goals: updateGoals(state, action.goals),
    cachedGoals: updateCachedGoals(state, action.goals)
  }),
  [TABLE_ROW_SELECTED]: rowSelect,
  [TABLE_ROW_DESELECTED]: (state, action) => state.updateIn(['selectedRows'],
    list => list.delete(list.indexOf(action.goalId))), // eslint-disable-line dot-notation
  [TABLE_ROW_ALL_SELECTION_TOGGLE]: (state, action) => action.checked ?
    state.set('selectedRows', state.get('goals').map(goal => goal.get('id'))) :
    state.set('selectedRows', new Immutable.List),
  [TABLE_ROW_SELECTION_START]: rowSelectionStart,
  [TABLE_ROW_SELECTION_END]: rowSelectionEnd,
  [TABLE_ROW_SELECTION_CANCEL]: rowSelectionCancel,
  [ROWS_PER_PAGE_CHANGED]: (state, action) => state.set('rowsPerPage', action.value),
  [SET_TOTAL_GOAL_COUNT]: (state, action) => state.set('totalGoalCount', action.count),
  [SET_CURRENT_PAGE]: (state, action) => state.set('currentPage', action.page),
  [SET_TABLE_ORDER]: (state, action) => state.set('tableOrder',
    Immutable.fromJS({ column: action.column, direction: action.direction })),
  [REMOVE_GOAL_FROM_CACHE]: (state, action) => state.deleteIn(['cachedGoals', action.goalId])
});
