export const UPDATE_METADATA = 'UPDATE_METADATA';
export function updateMetadata(key, newValue) {
  return {
    type: UPDATE_METADATA,
    key,
    newValue
  };
}

export function saveMetadata() {
  return (dispatch, getState) => {
    const metadata = getState().metadata;
    fetch(`/api/views/${window.initialState.view.id}`, {
      method: 'PUT',
      credentials: 'same-origin',
      body: JSON.stringify({
        name: metadata.name,
        description: metadata.description,
        category: metadata.category
      })
    });
  };
}
