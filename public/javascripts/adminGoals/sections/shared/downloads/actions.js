export const types = {
  start: 'shared.downloads.start',
  cancel: 'shared.downloads.cancel',
  success: 'shared.downloads.success',
  failed: 'shared.downloads.failed'
};

export const start = (section, fileName, fileUrl) => ({
  type: types.start,
  section,
  fileName,
  'genericDownload.create': {
    fileName,
    fileUrl,
    successActionType: types.success,
    failureActionType: types.failed
  }
});

export const cancel = (section, fileName) => ({
  type: types.cancel,
  section,
  fileName,
  'genericDownload.cancel': {
    fileName
  }
});
