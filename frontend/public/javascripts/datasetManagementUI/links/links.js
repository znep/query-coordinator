const base = params => {
  let prefix = '';

  if (params.locale) {
    prefix = `/${params.locale}`;
  }

  return `${prefix}/${params.category}/${params.name}/${params.fourfour}`;
};

export const revisionBase = params => `${base(params)}/revisions/${params.revisionSeq}`;

export const home = revisionBase;

export const manageTab = params => `${revisionBase(params)}/manageTab`;

export const metadata = params => `${revisionBase(params)}/metadata`;

export const datasetMetadataForm = params => `${revisionBase(params)}/metadata/dataset`;

export const columnMetadataForm = (params, outputSchemaId, columnId) =>
  `${revisionBase(params)}/metadata/${outputSchemaId}/columns${columnId ? `#${columnId}` : ''}`;

export const sources = params => `${revisionBase(params)}/sources`;

export const urlSource = params => `${sources(params)}/url`;

export const hrefSource = params => `${sources(params)}/href`;

const transformColumnFragment = (params) => `/editor/${params.outputColumnId}`;

export const showOutputSchema = (params, sourceId, inputSchemaId, outputSchemaId, pageNo) => {
  const showBase = `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}` +
    `/output/${outputSchemaId}`;
  const page = `${pageNo ? `/page/${pageNo}` : ''}`;
  if (params.transformEditor) {
    return `${showBase}${transformColumnFragment(params)}${page}`;
  } else {
    return `${showBase}${page}`;
  }
};


export const showBlobPreview = (params, blobId) => `${revisionBase(params)}/sources/${blobId}/preview`;

export const showParseOptions = params => {
  const { sourceId, inputSchemaId, outputSchemaId } = params;
  return (
    `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}` +
    `/output/${outputSchemaId}/parse_options`
  );
};

export const geocodeShortcut = params => {
  const { sourceId, inputSchemaId, outputSchemaId } = params;
  return (
    `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}` +
    `/output/${outputSchemaId}/georeference`
  );
};

export const showAddCol = params => {
  const { sourceId, inputSchemaId, outputSchemaId } = params;
  return (
    `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}` +
    `/output/${outputSchemaId}/add_col`
  );
};

export const geocodeColumn = (params) => {
  return (
    `${revisionBase(params)}/sources/${params.sourceId}/schemas/${params.inputSchemaId}` +
    `/output/${params.outputSchemaId}/georeference`
  );
};

export const transformColumn = (params, sourceId, inputSchemaId, outputSchemaId, outputColumnId) => {
  return (
    `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}` +
    `/output/${outputSchemaId}/editor/${outputColumnId}`
  );
};

export const transformColumnErrors = (
  params,
  sourceId,
  inputSchemaId,
  outputSchemaId,
  outputColumnId,
  transformId
) => {
  return `${transformColumn(
    params,
    sourceId,
    inputSchemaId,
    outputSchemaId,
    outputColumnId
  )}/column_errors/${transformId}`;
};

export const showColumnErrors = (
  params,
  sourceId,
  inputSchemaId,
  outputSchemaId,
  errorsTransformId,
  pageNo
) => {
  const showBase = `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
    `${outputSchemaId}`;
  const columnErrors = `/column_errors/${errorsTransformId}`;
  const page = `${pageNo ? `/page/${pageNo}` : ''}`;

  if (params.transformEditor) {
    return `${showBase}${transformColumnFragment(params)}${columnErrors}${page}`;
  }

  return `${showBase}${columnErrors}${page}`;

};

export const showRowErrors = (params, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
  `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/row_errors` +
  `${pageNo ? `/page/${pageNo}` : ''}`;
