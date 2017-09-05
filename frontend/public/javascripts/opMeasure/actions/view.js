export const SET_ACTIVE_PANE = 'SET_ACTIVE_PANE';
export const setActivePane = (activePane) => ({
  type: SET_ACTIVE_PANE,
  activePane
});

export const UPDATE_MEASURE = 'UPDATE_MEASURE';
export const updateMeasure = (measure) => ({
  type: UPDATE_MEASURE,
  measure
});

export const ENTER_PREVIEW_MODE = 'ENTER_PREVIEW_MODE';
export const enterPreviewMode = () => ({
  type: ENTER_PREVIEW_MODE
});

export const ENTER_EDIT_MODE = 'ENTER_EDIT_MODE';
export const enterEditMode = () => ({
  type: ENTER_EDIT_MODE
});
