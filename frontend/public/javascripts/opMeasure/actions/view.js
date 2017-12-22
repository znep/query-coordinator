import _ from 'lodash';

import { fetchJson, defaultHeaders } from 'common/http';

export const SAVE_START = 'SAVE_START';
export const saveStart = () => ({
  type: SAVE_START
});

export const SAVE_COMPLETE = 'SAVE_COMPLETE';
export const saveComplete = (error) => ({
  type: SAVE_COMPLETE,
  error
});
// Saves the measure from the viewer state.
export const saveMeasure = () => {
  return async (dispatch, getState) => {
    const { coreView, measure } = getState().view;

    // Saving happens in two requests, because Measures exist in both the ViewsService
    // and MeasuresService.

    dispatch(saveStart());

    try {
      const viewBody = _.pick(coreView, 'id', 'name', 'description');
      const viewPath = `/api/views/${coreView.id}`;
      await fetchJson(viewPath, {
        body: JSON.stringify(viewBody),
        credentials: 'same-origin',
        headers: defaultHeaders,
        method: 'PUT'
      });

      const measurePath = `/api/measures_v1/${coreView.id}`;
      await fetchJson(measurePath, {
        body: JSON.stringify(measure),
        credentials: 'same-origin',
        headers: defaultHeaders,
        method: 'PUT'
      });

      dispatch(saveComplete());
    } catch (e) {
      dispatch(saveComplete(e));
    }
  };
};

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
