import _ from 'lodash';
import { fetchOptions } from '../constants';
import downloadBlob from '../helpers/downloadBlob';

/**
 * This middleware interprets generic file download actions. It starts fetching
 * data as ajax request then when it is fetched uses downloadBlob helper to open
 * a file save dialog to the user. It also dispatches success and failure messages
 * which they are configured in the action information. Please see
 * actions/genericDownloadActions.js for how to configure these options.
 */

let canceledDownloads = {};
let inProgressDownloads = {};
const triggerDownload = (fileUrl, fileName) => blob => {
  if (canceledDownloads[fileUrl]) {
    return;
  }

  downloadBlob(fileName, blob);
};

const clearDownload = fileUrl => () => {
  delete canceledDownloads[fileUrl];
  delete inProgressDownloads[fileUrl];
};

const checkIfCreate = action => _.has(action, ['genericDownload.create']);
const checkIfCancel = action => _.has(action, ['genericDownload.cancel']);

export default store => next => action => {
  const result = next(action);

  if (checkIfCreate(action)) {
    const { fileName, fileUrl, successActionType, failureActionType } = action['genericDownload.create'];
    const isInProgress = inProgressDownloads[fileUrl];

    if (!isInProgress) {
      const clear = clearDownload(fileUrl);
      clear();

      inProgressDownloads[fileUrl] =
        fetch(fileUrl, fetchOptions).
          then(response => {
            if (canceledDownloads[fileUrl]) {
              return;
            }

            return response.blob().
              then(triggerDownload(fileUrl, fileName)).
              then(() => store.dispatch({ type: successActionType, fileUrl })).
              then(clear);
          }).catch(reason => {
            store.dispatch({ type: failureActionType, reason });
            clear();
          });
    } else if (canceledDownloads[fileUrl]) {
      delete canceledDownloads[fileUrl];
    }
  }

  if (checkIfCancel(action)) {
    const { fileUrl } = action['genericDownload.cancel'];
    canceledDownloads[fileUrl] = true;
  }

  return result;
};
