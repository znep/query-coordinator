export const EDIT_OUTPUT_SCHEMA = 'EDIT_OUTPUT_SCHEMA';
export function editOutputSchema(id, payload) {
  return {
    type: EDIT_OUTPUT_SCHEMA,
    id,
    payload
  };
}
