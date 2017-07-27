export const home = pathname => pathname;

export const manageTab = pathname => `${pathname}/manageTab`;

export const metadata = pathname => `${pathname}/metadata`;

export const datasetMetadataForm = pathname => `${pathname}/metadata/dataset`;

export const columnMetadataForm = (pathname, outputSchemaId, columnId) =>
  `${pathname}/metadata/${outputSchemaId}/columns${columnId ? `#${columnId}` : ''}`;

export const sources = pathname => `${pathname}}/sources`;

export const showOutputSchema = (pathname, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
  `${pathname}/sources/${sourceId}/schemas/${inputSchemaId}/output/${outputSchemaId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showColumnErrors = (
  pathname,
  sourceId,
  inputSchemaId,
  outputSchemaId,
  errorsTransformId,
  pageNo
) =>
  `${pathname}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/column_errors/${errorsTransformId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showRowErrors = (pathname, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
  `${pathname}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/row_errors` +
  `${pageNo ? `/page/${pageNo}` : ''}`;
