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

export const CLEAR_SAVE_TOAST = 'CLEAR_SAVE_TOAST';
/*
 * Clears the save toast, optionally after a debounce delay.
 * The `debounce` param controls the time constant of the debounce.
 * As an example, this sets the time constant to 3 seconds:
 * clearSaveToast({ time: 3000 });
 *
 * See the redux-debounced documentation for full details:
 * https://github.com/ryanseddon/redux-debounced/blob/master/README.md
 *
 * If the `debounce` param is omitted, the toast is cleared immediately.
 */
export const clearSaveToast = (debounce) => ({
  type: CLEAR_SAVE_TOAST,
  meta: { debounce } // This is hooking into the react-debounced middleware.
});

// Saves the measure from the viewer state.
export const saveMeasure = () => {
  return async (dispatch, getState) => {
    const { coreView, measure } = getState().view;

    // Saving happens in two requests, because Measures exist in both the ViewsService
    // and MeasuresService.

    // Show the spinner, etc.
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

    dispatch(clearSaveToast({ time: 3000 }));
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
