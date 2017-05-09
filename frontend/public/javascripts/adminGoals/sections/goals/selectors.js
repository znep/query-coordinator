import _ from 'lodash';
import * as Reselect from 'reselect';
import * as Immutable from 'immutable';
import * as Helpers from '../../helpers';
import * as SharedSelectors from '../shared/selectors';
import * as State from './state';
import * as Constants from './constants';
import moment from 'moment';

export const getGoalById = (state, goalId) => {
  return State.getData(state).find(goal => goal.get('id') === goalId);
};

// Given a goal ID, returns one of the 3 below strings:
// 'status_public': If the goal is public, and no drafts have been created since publishing.
// 'status_public_with_draft': If the goal is public, but has an unpublished draft.
// 'status_private': If the goal is private (regardless of draft situation).
export const getGoalPublicationStatus = (state, goalId) => {
  const goal = getGoalById(state, goalId);
  const isPublic = goal.get('is_public');
  const draftTime = goal.getIn([ 'narrative', 'draft', 'created_at' ]);
  const publishedTime = goal.getIn([ 'narrative', 'published', 'created_at' ]);

  // These scenarios are _not_ treated as unpublished drafts:
  // * Domain is still using classic editor.
  // * Particular goal was never loaded in Storyteller.

  let goalPublicationStatus;

  const hasBeenMigrated = _.isString(draftTime) || _.isString(publishedTime);
  if (hasBeenMigrated) {
    const draftTimeParsed = new Date(draftTime);
    const publishedTimeParsed = new Date(publishedTime);

    const hasUnpublishedDraft = _.isNil(publishedTime) ||
      draftTimeParsed.getTime() > publishedTimeParsed.getTime();

    const publicStatus = hasUnpublishedDraft  ? 'status_public_with_draft' : 'status_public';
    goalPublicationStatus = isPublic ? publicStatus : 'status_private';
  } else {
    goalPublicationStatus = isPublic ? 'status_public' : 'status_private';
  }

  return goalPublicationStatus;
};

const getStatus = (translations, goal) => {
  return translations.getIn(['measure', 'progress', goal.get('status')], '');
};

const fieldGetterByColumnName = {
  title: () => (goal) => goal.get('name', ''),
  owner: () => (goal) => goal.get('owner_name', ''),
  updated_at: () => (goal) => moment(goal.get('updated_at') || goal.get('created_at')),
  visibility: () => (goal) => goal.get('is_public', false),
  goal_status: (translations) => (goal) => getStatus(translations, goal),
  dashboard: () => (goal) => goal.get('base_dashboard', '')
};

export const getSortedGoals = Reselect.createSelector(
  [State.getTranslations, State.getData, State.getSorting],
  (translations, goals, sortingMap) => {
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
      comparator = Helpers.comparators.invert(comparator);
    }

    return goals.toSeq().sortBy(fieldGetterByColumnName[fieldName](translations), comparator);
  }
);

export const getSelectedGoals = Reselect.createSelector(
  State.getData, State.getSelectedIds,
  (goals, selectedIds) => goals.toSeq().filter(goal => selectedIds.includes(goal.get('id')))
);

// True if all selected goals have a prevailing measure, false otherwise.
// If no goals are selected, returns true.
export const areAllSelectedGoalsConfigured = Reselect.createSelector(
  getSelectedGoals,
  (goals) => goals.every(goal => goal.has('prevailing_measure'))
);

// Returns a list of selected goals which are not configured.
export const getUnconfiguredSelectedGoals = Reselect.createSelector(
  getSelectedGoals,
  (goals) => goals.filter(goal => !goal.has('prevailing_measure'))
);

// True if all selected goals have at least one draft.
export const areAllSelectedGoalsPublishable = Reselect.createSelector(
  getSelectedGoals,
  (goals) => goals.every(goal => goal.getIn([ 'narrative', 'draft', 'created_at' ]))
);

// Returns a list of selected goals which have no associated draft.
export const getDraftlessSelectedGoals = Reselect.createSelector(
  getSelectedGoals,
  //(goals) => goals.filter(goal => _.isNil(goal.getIn([ 'narrative', 'draft', 'created_at' ])))
  (goals) => goals
);

export const getNumberOfPages = Reselect.createSelector(
  State.getData, State.getPagination,
  (goals, pagination) => Math.max(1, Math.ceil(goals.count() / pagination.get('goalsPerPage')))
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
    const selectedIdsCount = selectedIds.count();

    if (selectedIdsCount === 0 || selectedIdsCount !== paginatedGoalIds.count())
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

export const getCsvExport = state => SharedSelectors.Downloads.getFile(state, 'goals', Constants.goalsCsvFilename);

export const getLoading = SharedSelectors.getLoading;
