import { updateMeasure } from './view';

export const SET_ANALYSIS = 'SET_ANALYSIS';
export const setAnalysis = (analysis) => ({
  type: SET_ANALYSIS,
  analysis
});

export const SET_METHODS = 'SET_METHODS';
export const setMethods = (methods) => ({
  type: SET_METHODS,
  methods
});

export const CLONE_MEASURE = 'CLONE_MEASURE';
export const cloneMeasure = (measure) => ({
  type: CLONE_MEASURE,
  measure
});

export const OPEN_EDIT_MODAL = 'OPEN_EDIT_MODAL';
export const openEditModal = () => ({
  type: OPEN_EDIT_MODAL
});

export const CLOSE_EDIT_MODAL = 'CLOSE_EDIT_MODAL';
export const closeEditModal = () => ({
  type: CLOSE_EDIT_MODAL
});

// Clone the view's measure into the editor's state, then open the edit modal.
export const launchEditModal = () => {
  return (dispatch, getState) => {
    dispatch(cloneMeasure(getState().view.measure));
    dispatch(openEditModal());
  };
};

// Clone the editor's measure into the view's state, then close the edit modal.
export const completeEditModal = () => {
  return (dispatch, getState) => {
    dispatch(updateMeasure(getState().editor.measure));
    dispatch(closeEditModal());
  };
};
