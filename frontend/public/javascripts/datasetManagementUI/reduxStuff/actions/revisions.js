export const EDIT_REVISION = 'EDIT_REVISION';
export const editRevision = (id, payload) => ({
  type: EDIT_REVISION,
  id,
  payload
});
