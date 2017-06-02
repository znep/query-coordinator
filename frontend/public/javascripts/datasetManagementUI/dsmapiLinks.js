const base = '/api/publishing/v1';

export const revisionBase =
  `${base}/revision/${window.initialState.view.id}/${window.initialState.revision.revision_seq}`;

export const uploadIndex = `${revisionBase}/upload`;
export const uploadCreate = uploadIndex;

export const uploadBytes = (uploadId) => `${base}/upload/${uploadId}`;
export const uploadShow = uploadBytes;

// TODO: find names controller uses!
export const newOutputSchema = (uploadId, inputSchemaId) => {
  return `${base}/upload/${uploadId}/schema/${inputSchemaId}`;
};

export const applyRevision = `${revisionBase}/apply`;

export const columnErrors = (uploadId, inputSchemaId, outputSchemaId, columnId, limit, offset) =>
  `${base}/upload/${uploadId}/schema/${inputSchemaId}/errors/${outputSchemaId}` +
    `?limit=${limit}&offset=${offset}&column_id=${columnId}`;

export const rowErrors = (uploadId, inputSchemaId, limit, offset) =>
  `${base}/upload/${uploadId}/schema/${inputSchemaId}/errors?limit=${limit}&offset=${offset}`;

export const rows = (uploadId, inputSchemaId, outputSchemaId, limit, offset) =>
  `${base}/upload/${uploadId}/schema/${inputSchemaId}/rows/${outputSchemaId}` +
    `?limit=${limit}&offset=${offset}`;

export const errorExport = (uploadId, inputSchemaId, outputSchemaId) =>
  `${base}/upload/${uploadId}/schema/${inputSchemaId}/errors/${outputSchemaId}`;

export const validateRowIdentifier = (uploadId, transformId) =>
  `${base}/upload/${uploadId}/transform/${transformId}/validate_row_identifier`;
