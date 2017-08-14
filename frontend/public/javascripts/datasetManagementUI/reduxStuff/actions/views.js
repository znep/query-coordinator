export const EDIT_VIEW = 'EDIT_VIEW';
export const SET_VALUE = 'SET_VALUE';
export const editView = (id, payload) => ({
  type: EDIT_VIEW,
  id,
  payload
});

export const setValue = (path, value) => ({
  type: SET_VALUE,
  path,
  value
});
