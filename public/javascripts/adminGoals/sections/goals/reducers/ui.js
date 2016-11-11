import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from '../actions/ui';

const initialState = Immutable.fromJS({
  pagination: {
    currentPage: 0,
    goalsPerPage: 25
  },
  selectedGoalIds: [],
  lastSelectionTarget: null,
  sorting: {
    fieldName: 'title',
    fieldType: 'string',
    direction: 'asc'
  }
});

const setSelection = (state, { goalIds }) => state.set('selectedGoalIds', new Immutable.List(goalIds));
const toggleSelectionById = (state, { goalId }) => {
  return state.update('selectedGoalIds', goalIds => {
    if (goalIds.includes(goalId)) {
      return goalIds.remove(goalIds.indexOf(goalId));
    }

    return goalIds.push(goalId);
  }).set('lastSelectionTarget', goalId);
};

const sortBy = (state, { fieldName, fieldType, direction }) => state.mergeIn(['sorting'], {
  fieldName,
  fieldType,
  direction
});

const showPage = (state, { pageNumber }) => {
  return state.
    setIn(['pagination', 'currentPage'], pageNumber).
    set('selectedGoalIds', new Immutable.List);
};

const setGoalsPerPage = (state, { goalsPerPage, goalsCount }) => {
  const numberOfPages = Math.max(1, Math.ceil(goalsCount / goalsPerPage));

  let newState = state.setIn(['pagination', 'goalsPerPage'], goalsPerPage);

  if (state.getIn(['pagination', 'currentPage'], 0) >= numberOfPages) {
    newState = newState.setIn(['pagination', 'currentPage'], numberOfPages - 1);
  }

  return newState;
};

const selectUntil = (state, { untilGoalId, paginatedGoalIds }) => {
  const lastSelectedId = state.get('lastSelectionTarget');
  if (!lastSelectedId) {
    return state.
      update('selectedGoalIds', ids => ids.push(untilGoalId)).
      set('lastSelectionTarget', untilGoalId);
  }

  // if untilGoalId is already clicked we should deselect the range
  const shouldDeselect = state.get('selectedGoalIds').includes(untilGoalId);

  const lastSelectedIndex = paginatedGoalIds.findIndex(goalId => goalId === lastSelectedId);
  const untilGoalIndex = paginatedGoalIds.findIndex(goalId => goalId === untilGoalId);

  if (untilGoalIndex === -1) {
    return state;
  }

  const range = paginatedGoalIds.slice(Math.min(lastSelectedIndex, untilGoalIndex), Math.max(lastSelectedIndex, untilGoalIndex) + 1);

  let newSelectedGoalIds;
  const selectedGoalIds = state.get('selectedGoalIds');
  if (shouldDeselect) {
    newSelectedGoalIds = selectedGoalIds.filter(goalId => range.indexOf(goalId) === -1);
  } else {
    newSelectedGoalIds = selectedGoalIds.concat(range.filter(goalId => !selectedGoalIds.includes(goalId)));
  }

  return state.set('selectedGoalIds', newSelectedGoalIds).set('lastSelectionTarget', untilGoalId);
};

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.setSelection]: setSelection,
  [Actions.types.toggleSelectionById]: toggleSelectionById,
  [Actions.types.sortBy]: sortBy,
  [Actions.types.showPage]: showPage,
  [Actions.types.setGoalsPerPage]: setGoalsPerPage,
  [Actions.types.selectUntil]: selectUntil
});
