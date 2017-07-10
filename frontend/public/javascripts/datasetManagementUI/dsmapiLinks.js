const base = '/api/publishing/v1';

export const revisionBase =
  `${base}/revision/${window.initialState.view.id}/${window.initialState.revision.revision_seq}`;

export const sourceIndex = `${revisionBase}/source`;
export const sourceCreate = sourceIndex;

export const sourceBytes = (sourceId) => `${base}/source/${sourceId}`;
export const sourceShow = sourceBytes;

// TODO: find names controller uses!
export const newOutputSchema = (sourceId, inputSchemaId) => {
  return `${base}/source/${sourceId}/schema/${inputSchemaId}`;
};

export const applyRevision = `${revisionBase}/apply`;

export const columnErrors = (sourceId, inputSchemaId, outputSchemaId, columnId, limit, offset) =>
  `${base}/source/${sourceId}/schema/${inputSchemaId}/errors/${outputSchemaId}` +
    `?limit=${limit}&offset=${offset}&column_id=${columnId}`;

export const rowErrors = (sourceId, inputSchemaId, limit, offset) =>
  `${base}/source/${sourceId}/schema/${inputSchemaId}/errors?limit=${limit}&offset=${offset}`;

export const rows = (sourceId, inputSchemaId, outputSchemaId, limit, offset) =>
  `${base}/source/${sourceId}/schema/${inputSchemaId}/rows/${outputSchemaId}` +
    `?limit=${limit}&offset=${offset}`;

export const errorExport = (sourceId, inputSchemaId, outputSchemaId) =>
  `${base}/source/${sourceId}/schema/${inputSchemaId}/errors/${outputSchemaId}`;

export const validateRowIdentifier = (sourceId, transformId) =>
  `${base}/source/${sourceId}/transform/${transformId}/validate_row_identifier`;
