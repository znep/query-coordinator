export const types = {
  setSelection: 'goals.ui.setSelection',
  toggleSelectionById: 'goals.ui.toggleSelectionById',
  sortBy: 'goals.ui.sortBy',
  showPage: 'goals.ui.showPage',
  setGoalsPerPage: 'goals.ui.setGoalsPerPage',
  selectUntil: 'goals.ui.selectUntil'
};

export const setSelection = goalIds => ({
  type: types.setSelection,
  goalIds
});

export const toggleSelectionById = goalId => ({
  type: types.toggleSelectionById,
  goalId
});

/**
 * Sort data
 * @param { fieldName, direction, fieldType} options
 */
export const sortBy = options => Object.assign({ type: types.sortBy }, options);

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
