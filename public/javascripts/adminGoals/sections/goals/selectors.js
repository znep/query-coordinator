import * as Reselect from 'reselect';
import * as State from './state';
import * as Immutable from 'immutable';

export const getGoalForQuickEdit = state => {
  const goals = state.getIn(['goals', 'data']);
  const goalId = state.getIn(['goals', 'quickEdit', 'goalId']);

  return goals.get(goalId);
};

export const getSortedGoals = Reselect.createSelector(
  State.getData, State.getSorting,
  (goals, sortingMap) => {
    if (sortingMap.get('fieldName') === 'default')
      return goals;

    const sorting = sortingMap.toJS();

    const sortedGoals = goals.toSeq().sortBy(goal => goal.get(sorting.fieldName));

    return sorting.direction === 'asc' ? sortedGoals : sortedGoals.reverse();
  }
);

export const getSelectedGoals = Reselect.createSelector(
  State.getData, State.getSelectedIds,
  (goals, selectedIds) => goals.toSeq().filter(goal => selectedIds.includes(goal.get('id')))
);

export const getNumberOfPages = Reselect.createSelector(
  State.getData, State.getPagination,
  (goals, pagination) => Math.max(1, Math.floor(goals.count() / pagination.get('goalsPerPage')))
);

export const getPaginatedGoals = Reselect.createSelector(
  getSortedGoals, State.getPagination, getNumberOfPages,
  (goals, pagination) => {
    const goalsPerPage = pagination.get('goalsPerPage');
    const currentPage = pagination.get('currentPage');

    const begin = goalsPerPage * currentPage;
    const end = begin + goalsPerPage;

    return goals.slice(begin, end);
  }
);

export const getPaginatedGoalIds = Reselect.createSelector(
  getPaginatedGoals,
  goals => goals.map(goal => goal.get('id'))
);

export const getIsAllSelected = Reselect.createSelector(
  getPaginatedGoalIds, State.getSelectedIds,
  (paginatedGoalIds, selectedIds) => {
    if (selectedIds.count() !== paginatedGoalIds.count())
      return false;

    return selectedIds.isSuperset(paginatedGoalIds);
  }
);

const getSameValue = (items, ...properties) => {
  const firstItem = items.first();
  const firstValue = firstItem ? firstItem.getIn(properties) : null;
  const allSame = items.every(item => item.getIn(properties) === firstValue);
  return allSame ? firstValue : null;
};

export const getCommonData = Reselect.createSelector(
  getSelectedGoals,
  goals => Immutable.fromJS({
    is_public: getSameValue(goals, 'is_public'),
    prevailing_measure: {
      start: getSameValue(goals, 'prevailing_measure', 'start'),
      end: getSameValue(goals, 'prevailing_measure', 'end'),
      metadata: {
        use_progress_override: getSameValue(goals, 'prevailing_measure', 'metadata', 'use_progress_override'),
        progress_override: getSameValue(goals, 'prevailing_measure', 'metadata', 'progress_override')
      }
    }
  })
);

const getQuickEditGoalId = state => State.getQuickEdit(state).get('goalId');

export const getQuickEditGoal = Reselect.createSelector(
  State.getData, getQuickEditGoalId,
  (goals, goalId) => goals.find(goal => goal.id === goalId)
);
