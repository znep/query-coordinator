export const home = params =>
  `${params.locale
    ? params.locale
    : ''}/${params.category}/${params.name}/${params.fourfour}/revisions/${params.revisionSeq}`;

export const manageTab = params => `${home(params)}/manageTab`;

export const metadata = params => `${home(params)}/metadata`;

export const datasetMetadataForm = params => `${home(params)}/metadata/dataset`;

export const columnMetadataForm = (params, outputSchemaId, columnId) =>
  `${home(params)}/metadata/${outputSchemaId}/columns${columnId ? `#${columnId}` : ''}`;

export const sources = params => `${home(params)}/sources`;

export const showOutputSchema = (params, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
  `${home(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/${outputSchemaId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showColumnErrors = (
  params,
  sourceId,
  inputSchemaId,
  outputSchemaId,
  errorsTransformId,
  pageNo
) =>
  `${home(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/column_errors/${errorsTransformId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showRowErrors = (params, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
  `${home(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/row_errors` +
  `${pageNo ? `/page/${pageNo}` : ''}`;
