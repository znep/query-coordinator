import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from '../actions/ui';

const initialState = Immutable.fromJS({
  data: {},
  pagination: {
    currentPage: 0,
    goalsPerPage: 25
  },
  selectedGoalIds: [],
  sorting: {
    fieldName: 'default',
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

const showPage = (state, { pageNumber }) => state.setIn(['pagination', 'currentPage'], pageNumber);
const setGoalsPerPage = (state, { goalsPerPage }) => state.setIn(['pagination', 'goalsPerPage'], goalsPerPage);

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.setSelection]: setSelection,
  [Actions.types.toggleSelectionById]: toggleSelectionById,
  [Actions.types.sortBy]: sortBy,
  [Actions.types.showPage]: showPage,
  [Actions.types.setGoalsPerPage]: setGoalsPerPage
});
