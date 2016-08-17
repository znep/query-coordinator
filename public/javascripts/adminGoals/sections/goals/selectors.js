import * as Reselect from 'reselect';
import * as State from './state';
import * as Immutable from 'immutable';
import * as Helpers from '../../helpers';
import moment from 'moment';

export const getGoalForQuickEdit = state => {
  const goals = state.getIn(['goals', 'data']);
  const goalId = state.getIn(['goals', 'quickEdit', 'goalId']);

  return goals.get(goalId);
};

const fieldGetterByColumnName = {
  title: goal => goal.get('name', ''),
  owner: goal => goal.get('owner_name', ''),
  updated_at: goal => moment(goal.get('updated_at')),
  visibility: goal => goal.get('is_public', false),
  goal_status: goal => goal.getIn(['prevailing_measure', 'metadata', 'progress_override'], ''),
  dashboard: goal => goal.get('base_dashboard', '')
};

export const getSortedGoals = Reselect.createSelector(
  [State.getData, State.getSorting],
  (goals, sortingMap) => {
    if (sortingMap.get('fieldName') === 'default')
      return goals;

    const direction = sortingMap.get('direction');
    const fieldName = sortingMap.get('fieldName');
    const fieldType = sortingMap.get('fieldType');

    let comparator = Helpers.comparators[fieldType];
    if (!comparator) {
      return goals;
    }

    if (direction === 'desc') {
      comparator = Helpers.comparators.negate(comparator);
    }

    return goals.toSeq().sortBy(fieldGetterByColumnName[fieldName], comparator);
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

const getGoalsPerPage = state => State.getPagination(state).get('goalsPerPage');
const getCurrentPage = state => State.getPagination(state).get('currentPage');

export const getPaginatedGoals = Reselect.createSelector(
  getSortedGoals, getGoalsPerPage, getCurrentPage,
  (goals, goalsPerPage, currentPage) => {
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
  (goals, goalId) => goals.find(goal => goal.get('id') === goalId)
);
