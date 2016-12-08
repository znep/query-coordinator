export const ADD_VISUALIZATION = 'ADD_VISUALIZATION';
export const addVisualization = () => ({
  type: ADD_VISUALIZATION
});

export const CANCEL_EDITING_VISUALIZATION = 'CANCEL_EDITING_VISUALIZATION';
export const cancelEditingVisualization = () => ({
  type: CANCEL_EDITING_VISUALIZATION
});

export const UPDATE_VISUALIZATION = 'UPDATE_VISUALIZATION';
export const updateVisualization = (data) => ({
  type: UPDATE_VISUALIZATION,
  data
});

export const ENTER_PREVIEW_MODE = 'ENTER_PREVIEW_MODE';
export const enterPreviewMode = () => ({
  type: ENTER_PREVIEW_MODE
});

export const ENTER_EDIT_MODE = 'ENTER_EDIT_MODE';
export const enterEditMode = () => ({
  type: ENTER_EDIT_MODE
});
