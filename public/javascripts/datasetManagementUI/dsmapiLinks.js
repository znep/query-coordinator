export const updateBase =
  `/api/update/${window.initialState.view.id}/${window.initialState.update.update_seq}`;

export const uploadIndex = `${updateBase}/upload`;
export const uploadCreate = uploadIndex;

export const uploadBytes = (uploadId) => `${updateBase}/upload/${uploadId}`;
export const uploadShow = uploadBytes;

// TODO: find names controller uses!
export const updateSchema = (inputSchemaId) => `${updateBase}/schema/${inputSchemaId}`;

export const transformResults = (transformId, limit, offset) => {
  return `/api/update/${window.initialState.view.id}/transform/${transformId}` +
         `/results?limit=${limit}&offset=${offset}`;
};

export const applyUpdate = `${updateBase}/apply`;
