export const home = routing => {

  if (!routing.locationBeforeTransitions && !routing.pathname) {
    // on initial action, routes haven't been loaded
    return '';
  }

  const path = routing.pathname ? routing.pathname : routing.locationBeforeTransitions.pathname;
  const matches = path.match(/^\/(\w{2}\/)?[\w-]+\/[^\/]+\/\w{4}-\w{4}\/revisions\/\d+/);
  return matches[0];
};

export const manageTab = routing => `${home(routing)}/manageTab`;
export const metadata = routing => `${home(routing)}/metadata`;
export const datasetMetadataForm = routing => `${home(routing)}/metadata/dataset`;
export const columnMetadataForm = (outputSchemaId, columnId) => routing => (
  `${home(routing)}/metadata/${outputSchemaId}/columns${columnId ? `#${columnId}` : ''}`
);
export const sources = routing => `${home(routing)}/sources`;

export const showOutputSchema = (sourceId, inputSchemaId, outputSchemaId, pageNo) => routing =>
  `${home(routing)}/sources/${sourceId}/schemas/${inputSchemaId}/output/${outputSchemaId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showColumnErrors = (
  sourceId,
  inputSchemaId,
  outputSchemaId,
  errorsTransformId,
  pageNo
) => routing =>
  `${home(routing)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/column_errors/${errorsTransformId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showRowErrors = (sourceId, inputSchemaId, outputSchemaId, pageNo) => routing =>
  `${home(routing)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/row_errors` +
  `${pageNo ? `/page/${pageNo}` : ''}`;
