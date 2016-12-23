export const home = (routing) => {
  if (!routing.locationBeforeTransitions && !routing.pathname) {
    // on initial action, routes haven't been loaded
    return '';
  }

  const path = (routing.pathname) ?
    routing.pathname : routing.locationBeforeTransitions.pathname;

  const matches = path.match(/^\/\w+\/.+\/\w{4}-\w{4}\/updates\/\d+/);
  return matches[0];
};

export const metadata = (routing) => `${home(routing)}/metadata`;
export const uploads = (routing) => `${home(routing)}/uploads`;


export const showUpload = (uploadId) => (
  (routing) => `${home(routing)}/uploads/${uploadId}`
);

export const showOutputSchema = (uploadId, schemaId, outputSchemaId) => (
  (routing) => `${home(routing)}/uploads/${uploadId}/schemas/${schemaId}/output/${outputSchemaId}`
);

export const showUpsertJob = (upsertJobId) => (
  (routing) => `${home(routing)}/upsert_jobs/${upsertJobId}`
);
