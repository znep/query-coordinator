import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from '../actions/ui';

const initialState = Immutable.fromJS({
  pagination: {
    currentPage: 0,
    goalsPerPage: 25
  },
  selectedGoalIds: [],
  sorting: {
    fieldName: 'title',
    fieldType: 'string',
    direction: 'asc'
  }
});

const setSelection = (state, { goalIds }) => state.set('selectedGoalIds', Immutable.List(goalIds));
const toggleSelectionById = (state, { goalId }) => state.update('selectedGoalIds', goalIds => {
  if (goalIds.includes(goalId)) {
    return goalIds.remove(goalIds.indexOf(goalId));
  }

  return goalIds.push(goalId);
});

const sortBy = (state, { fieldName, fieldType, direction }) => state.mergeIn(['sorting'], {
  fieldName,
  fieldType,
  direction
});

const showPage = (state, { pageNumber }) => {
  return state.setIn(['pagination', 'currentPage'], pageNumber).set('selectedGoalIds', Immutable.List([]));
};

const setGoalsPerPage = (state, { goalsPerPage }) => state.setIn(['pagination', 'goalsPerPage'], goalsPerPage);

const selectUntil = (state, { untilGoalId, paginatedGoalIds }) => {
  const lastSelectedId = state.get('selectedGoalIds').last();
  if (!lastSelectedId) {
    return state.update('selectedGoalIds', ids => ids.push(untilGoalId));
  }

  const lastSelectedIndex = paginatedGoalIds.findIndex(goalId => goalId === lastSelectedId);
  const untilGoalIndex = paginatedGoalIds.findIndex(goalId => goalId === untilGoalId);

  if (untilGoalIndex === -1) {
    return state;
  }

  const range = paginatedGoalIds.slice(Math.min(lastSelectedIndex, untilGoalIndex), Math.max(lastSelectedIndex, untilGoalIndex) + 1);
  return state.update('selectedGoalIds', selectedIds => selectedIds.concat(range.filter(goalId => !selectedIds.includes(goalId))));
};

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.setSelection]: setSelection,
  [Actions.types.toggleSelectionById]: toggleSelectionById,
  [Actions.types.sortBy]: sortBy,
  [Actions.types.showPage]: showPage,
  [Actions.types.setGoalsPerPage]: setGoalsPerPage,
  [Actions.types.selectUntil]: selectUntil
});
