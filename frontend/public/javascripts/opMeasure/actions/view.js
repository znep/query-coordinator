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
