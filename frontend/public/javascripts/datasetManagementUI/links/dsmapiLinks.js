const base = '/api/publishing/v1';

export const revisionsForView =
  `${base}/revision/${window.initialState.view.id}`;

// TODO: change callers of this to pass revisionSeq
export const revisionBase = (params) =>
  `${revisionsForView}/${params.revisionSeq}`;

export const addAttachment = (revision) =>
  `${revisionsForView}/${revision.revision_seq}/attachment`;

export const createRevision = revisionsForView;

export const sourceIndex = (params) => `${revisionBase(params)}/source`;
export const sourceCreate = sourceIndex;

export const sourceBytes = (sourceId) => `${base}/source/${sourceId}`;
export const sourceShow = sourceBytes;
export const sourceUpdate = sourceBytes;

// TODO: find names controller uses!
export const newOutputSchema = (sourceId, inputSchemaId) => {
  return `${base}/source/${sourceId}/schema/${inputSchemaId}`;
};

export const applyRevision = (params) => `${revisionBase(params)}/apply`;

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
