export const types = {
  setSelection: 'goals.ui.setSelection',
  toggleSelectionById: 'goals.ui.toggleSelectionById',
  sortBy: 'goals.ui.sortBy',
  showPage: 'goals.ui.showPage',
  setGoalsPerPage: 'goals.ui.setGoalsPerPage'
};

export const setSelection = goalIds => ({
  type: types.setSelection,
  goalIds
});

export const toggleSelectionById = goalId => ({
  type: types.toggleSelectionById,
  goalId
});

export const sortBy = (fieldName, direction, fieldType) => ({
  type: types.sortBy,
  fieldName,
  fieldType,
  direction
});

export const showPage = pageNumber => ({
  type: types.showPage,
  pageNumber
});

export const setGoalsPerPage = goalsPerPage => ({
  type: types.setGoalsPerPage,
  goalsPerPage
});
