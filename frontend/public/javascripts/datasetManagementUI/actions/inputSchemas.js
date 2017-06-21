export const EDIT_INPUT_SCHEMA = 'EDIT_INPUT_SCHEMA';
export function editInputSchema(id, payload) {
  return {
    type: EDIT_INPUT_SCHEMA,
    id,
    payload
  };
}
