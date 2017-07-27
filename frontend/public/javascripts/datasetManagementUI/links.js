export const home = location => {
  if (!location.pathname) {
    // on initial action, routes haven't been loaded
    return '';
  }
  const matches = location.pathname.match(/^\/(\w{2}\/)?[\w-]+\/[^\/]+\/\w{4}-\w{4}\/revisions\/\d+/);
  return matches[0];
};

export const manageTab = location => `${home(location)}/manageTab`;
export const metadata = location => `${home(location)}/metadata`;
export const datasetMetadataForm = location => `${home(location)}/metadata/dataset`;
export const columnMetadataForm = (outputSchemaId, columnId) => location =>
  `${home(location)}/metadata/${outputSchemaId}/columns${columnId ? `#${columnId}` : ''}`;
export const sources = location => `${home(location)}/sources`;

export const showOutputSchema = (sourceId, inputSchemaId, outputSchemaId, pageNo) => location =>
  `${home(location)}/sources/${sourceId}/schemas/${inputSchemaId}/output/${outputSchemaId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showColumnErrors = (
  sourceId,
  inputSchemaId,
  outputSchemaId,
  errorsTransformId,
  pageNo
) => location =>
  `${home(location)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/column_errors/${errorsTransformId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showRowErrors = (sourceId, inputSchemaId, outputSchemaId, pageNo) => location =>
  `${home(location)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/row_errors` +
  `${pageNo ? `/page/${pageNo}` : ''}`;
