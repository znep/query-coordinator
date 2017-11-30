export const EDIT_TRANSFORM = 'EDIT_TRANSFORM';
export function editTransform(id, payload) {
  return {
    type: EDIT_TRANSFORM,
    id,
    payload
  };
}

