export const UPDATE_METADATA = 'UPDATE_METADATA';
export function updateMetadata(key, newValue) {
  return {
    type: UPDATE_METADATA,
    key,
    newValue
  };
}

export const OPEN_METADATA_MODAL = 'OPEN_METADATA_MODAL';
export function openMetadataModal() {
  return {
    type: OPEN_METADATA_MODAL
  };
}

export const CLOSE_METADATA_MODAL = 'CLOSE_METADATA_MODAL';
export function closeMetadataModal() {
  return {
    type: CLOSE_METADATA_MODAL
  };
}

// TODO: this should be a SAVE_METADATA action or something like that
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
    }).then(() => {
      // TODO: handle response success/failure differently
      dispatch(closeMetadataModal());
    }
  );
  };
}
