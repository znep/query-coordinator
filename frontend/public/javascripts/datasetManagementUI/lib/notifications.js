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
