export const EDIT_INPUT_COLUMN = 'EDIT_INPUT_COLUMN';
export function editInputColumn(id, payload) {
  return {
    type: EDIT_INPUT_COLUMN,
    id,
    payload
  };
}
