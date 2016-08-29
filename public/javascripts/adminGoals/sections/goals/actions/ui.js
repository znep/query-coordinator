import * as Analytics from '../../shared/analytics';
import _ from 'lodash';

export const types = {
  setSelection: 'goals.ui.setSelection',
  toggleSelectionById: 'goals.ui.toggleSelectionById',
  sortBy: 'goals.ui.sortBy',
  showPage: 'goals.ui.showPage',
  setGoalsPerPage: 'goals.ui.setGoalsPerPage',
  selectUntil: 'goals.ui.selectUntil',
  openGoalManagePage: 'goals.ui.openGoalManagePage'
};

export const setSelection = goalIds => ({
  type: types.setSelection,
  goalIds
});

export const toggleSelectionById = goalId => ({
  type: types.toggleSelectionById,
  goalId
});

export const openGoalManagePage = goalId => ({
  type: types.openGoalManagePage,
  ...Analytics.createTrackEventActionData(Analytics.EventNames.manageOnGoalPage, {
    [Analytics.EventPayloadKeys.goalId]: goalId
  })
});

/**
 * Sort data
 * @param { fieldName, direction, fieldType} options
 */
export const sortBy = options => _.merge({ type: types.sortBy }, options);

export const showPage = pageNumber => ({
  type: types.showPage,
  pageNumber
});

export const setGoalsPerPage = (goalsPerPage, goalsCount) => ({
  type: types.setGoalsPerPage,
  goalsPerPage,
  goalsCount
});

export const selectUntil = (paginatedGoalIds, untilGoalId) => ({
  type: types.selectUntil,
  paginatedGoalIds,
  untilGoalId
});
