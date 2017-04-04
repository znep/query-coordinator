export const home = (routing) => {
  if (!routing.locationBeforeTransitions && !routing.pathname) {
    // on initial action, routes haven't been loaded
    return '';
  }

  const path = (routing.pathname) ?
    routing.pathname : routing.locationBeforeTransitions.pathname;

  const matches = path.match(/^\/[\w-]+\/.+\/\w{4}-\w{4}\/updates\/\d+/);
  return matches[0];
};

export const activityLog = (routing) => `${home(routing)}/log`;
export const metadata = (routing) => `${home(routing)}/metadata`;
export const datasetMetadataEditor = (routing) => `${home(routing)}/metadata/dataset`;
export const columnMetadataEditor = (columnId) => (
  (routing) => `${home(routing)}/metadata/columns${columnId ? `#${columnId}` : ''}`
);
export const uploads = (routing) => `${home(routing)}/uploads`;


export const showUpload = (uploadId) => (
  (routing) => `${home(routing)}/uploads/${uploadId}`
);

export const showOutputSchema = (uploadId, inputSchemaId, outputSchemaId) => (
  (routing) => `${home(routing)}/uploads/${uploadId}/schemas/${inputSchemaId}/output/${outputSchemaId}`
);

export const showColumnErrors = (uploadId, inputSchemaId, outputSchemaId, errorsTransformId) => (
  (routing) =>
    `${home(routing)}/uploads/${uploadId}/schemas/${inputSchemaId}/output/` +
      `${outputSchemaId}/column_errors/${errorsTransformId}`
);

export const showRowErrors = (uploadId, inputSchemaId, outputSchemaId) => (
  (routing) =>
    `${home(routing)}/uploads/${uploadId}/schemas/${inputSchemaId}/output/` +
      `${outputSchemaId}/row_errors`
);
