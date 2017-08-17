export const home = params =>
  `${params.locale
    ? params.locale
    : ''}/${params.category}/${params.name}/${params.fourfour}/manage`;

export const revisionBase = (params) =>
  `${home(params)}/revisions/${params.revisionSeq}`;

export const manageTab = params => `${revisionBase(params)}/manageTab`;

export const metadata = params => `${revisionBase(params)}/metadata`;

export const datasetMetadataForm = params => `${revisionBase(params)}/metadata/dataset`;

export const columnMetadataForm = (params, outputSchemaId, columnId) =>
  `${revisionBase(params)}/metadata/${outputSchemaId}/columns${columnId ? `#${columnId}` : ''}`;

export const sources = params => `${revisionBase(params)}/sources`;

export const showOutputSchema = (params, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
`${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/${outputSchemaId}` +
`${pageNo ? `/page/${pageNo}` : ''}`;

export const showColumnErrors = (
  params,
  sourceId,
  inputSchemaId,
  outputSchemaId,
  errorsTransformId,
  pageNo
) =>
`${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
`${outputSchemaId}/column_errors/${errorsTransformId}` +
`${pageNo ? `/page/${pageNo}` : ''}`;

export const showRowErrors = (params, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
`${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
`${outputSchemaId}/row_errors` +
`${pageNo ? `/page/${pageNo}` : ''}`;
