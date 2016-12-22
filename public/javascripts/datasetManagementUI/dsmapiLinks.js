export const home = (routing) => {
  const path = (routing.pathname) ?
    routing.pathname : routing.locationBeforeTransitions.pathname;
  const matches = path.match(/^\/\w+\/.+\/(\w{4}-\w{4})\/updates\/(\d+)/);
  const fourfour = matches[1];
  const updateSeq = matches[2];
  return `/api/update/${fourfour}/${updateSeq}`;
};

export const uploadIndex = (routing) => `${home(routing)}/upload`;
export const uploadCreate = uploadIndex;

export const uploadBytes = (routing, uploadId) => `${home(routing)}/upload/${uploadId}`;
export const uploadShow = uploadBytes;

// TODO: find names controller uses!
export const updateSchema = (routing, inputSchemaId) => `${home(routing)}/schema/${inputSchemaId}`;

export const transformResults = (routing, transformId, limit, offset) => {
  const path = (routing.pathname) ?
    routing.pathname : routing.locationBeforeTransitions.pathname;
  const matches = path.match(/^\/\w+\/.+\/(\w{4}-\w{4})\/updates\/\d+/);
  const fourfour = matches[1];
  return `/api/update/${fourfour}/transform/${transformId}` +
         `/results?limit=${limit}&offset=${offset}`;
};
