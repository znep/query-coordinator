const base = '/api/publishing/v1';

export const revisionBase =
  `${base}/revision/${window.initialState.view.id}/${window.initialState.update.revision_seq}`;

export const uploadIndex = `${revisionBase}/upload`;
export const uploadCreate = uploadIndex;

export const uploadBytes = (uploadId) => `${base}/upload/${uploadId}`;
export const uploadShow = uploadBytes;

// TODO: find names controller uses!
export const newOutputSchema = (uploadId, inputSchemaId) => {
  return `${base}/upload/${uploadId}/schema/${inputSchemaId}`;
};

export const transformResults = (uploadId, transformId, limit, offset) => {
  return `${base}/upload/${uploadId}/transform/${transformId}` +
         `/results?limit=${limit}&offset=${offset}`;
};

export const applyUpdate = `${revisionBase}/apply`;

export const columnErrors = (uploadId, inputSchemaId, outputSchemaId, columnId, limit, offset) =>
  `${base}/upload/${uploadId}/schema/${inputSchemaId}/errors/${outputSchemaId}` +
    `?limit=${limit}&offset=${offset}&column_id=${columnId}`;

export const rowErrors = (uploadId, inputSchemaId, offset, limit) =>
  `${base}/upload/${uploadId}/schema/${inputSchemaId}/errors?limit=${limit}&offset=${offset}`;

export const errorExport = (uploadId, inputSchemaId, outputSchemaId) =>
  `${base}/upload/${uploadId}/schema/${inputSchemaId}/errors/${outputSchemaId}`;
