export const home = (routing) => {
  if (!routing.locationBeforeTransitions && !routing.pathname) {
    // on initial action, routes haven't been loaded
    return '';
  }

  const path = (routing.pathname) ?
    routing.pathname : routing.locationBeforeTransitions.pathname;

  const matches = path.match(/^\/[\w-]+\/.+\/\w{4}-\w{4}\/revisions\/\d+/);
  return matches[0];
};

export const activityLog = (routing) => `${home(routing)}/log`;
export const metadata = (routing) => `${home(routing)}/metadata`;
export const datasetMetadataForm = (routing) => `${home(routing)}/metadata/dataset`;
export const columnMetadataForm = (columnId) => (
  (routing) => `${home(routing)}/metadata/columns${columnId ? `#${columnId}` : ''}`
);
export const uploads = (routing) => `${home(routing)}/uploads`;


export const showUpload = (uploadId) => (
  (routing) => `${home(routing)}/uploads/${uploadId}`
);

export const showOutputSchema = (uploadId, inputSchemaId, outputSchemaId, pageNo) => (
  (routing) =>
    `${home(routing)}/uploads/${uploadId}/schemas/${inputSchemaId}/output/${outputSchemaId}` +
      `${(pageNo ? `/page/${pageNo}` : '')}`
);

export const showColumnErrors = (uploadId, inputSchemaId,
                                 outputSchemaId, errorsTransformId, pageNo) => (
  (routing) =>
    `${home(routing)}/uploads/${uploadId}/schemas/${inputSchemaId}/output/` +
      `${outputSchemaId}/column_errors/${errorsTransformId}` +
        `${(pageNo ? `/page/${pageNo}` : '')}`
);

export const showRowErrors = (uploadId, inputSchemaId, outputSchemaId, pageNo) => (
  (routing) =>
    `${home(routing)}/uploads/${uploadId}/schemas/${inputSchemaId}/output/` +
      `${outputSchemaId}/row_errors` +
        `${(pageNo ? `/page/${pageNo}` : '')}`
);
