export const EDIT_OUTPUT_COLUMN = 'EDIT_OUTPUT_COLUMN';
export const ADD_OUTPUT_COLUMNS = 'ADD_OUTPUT_COLUMNS';

export const editOutputColumn = (id, payload) => ({
  type: EDIT_OUTPUT_COLUMN,
  id,
  payload
});

export const addOutputColumns = payload => ({
  type: ADD_OUTPUT_COLUMNS,
  payload
});
