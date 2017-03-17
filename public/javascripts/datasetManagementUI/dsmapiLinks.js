export const updateBase =
  `/api/update/${window.initialState.view.id}/${window.initialState.update.update_seq}`;

export const uploadIndex = `${updateBase}/upload`;
export const uploadCreate = uploadIndex;

export const uploadBytes = (uploadId) => `${updateBase}/upload/${uploadId}`;
export const uploadShow = uploadBytes;

// TODO: find names controller uses!
export const newOutputSchema = (inputSchemaId) => `${updateBase}/schema/${inputSchemaId}`;

export const transformResults = (transformId, limit, offset) => {
  return `/api/update/${window.initialState.view.id}/transform/${transformId}` +
         `/results?limit=${limit}&offset=${offset}`;
};

export const applyUpdate = `${updateBase}/apply`;

export const columnErrors = (inputSchemaId, outputSchemaId, columnId, limit, offset) =>
  `${updateBase}/schema/${inputSchemaId}/errors/${outputSchemaId}` +
    `?limit=${limit}&offset=${offset}&column_id=${columnId}`;

export const rowErrors = (inputSchemaId, offset, limit) =>
  `${updateBase}/schema/${inputSchemaId}/errors?limit=${limit}&offset=${offset}`;

export const errorExport = (inputSchemaId, outputSchemaId) =>
  `${updateBase}/schema/${inputSchemaId}/errors/${outputSchemaId}`;
