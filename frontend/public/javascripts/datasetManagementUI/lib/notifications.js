export const UPLOAD_NOTIFICATION = 'UPLOAD_NOTIFICATION';
export const uploadNotification = (uploadId) => ({
  type: UPLOAD_NOTIFICATION,
  uploadId
});

export const UPSERT_JOB_NOTIFICATION = 'UPSERT_JOB_NOTIFICATION';
export const upsertJobNotification = (upsertJobId) => ({
  type: UPSERT_JOB_NOTIFICATION,
  upsertJobId
});

export const makeErrorMsg = code => {
  const badConnection = {
    title: I18n.progress_items.connection_error_title,
    body: I18n.progress_items.connection_error_body
  };

  switch (code) {
    case 0:
      return badConnection;
    case 502:
      return badConnection;
    default:
      return badConnection;
  }

};
