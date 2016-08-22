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
  if (canceledDownloads[fileName]) {
    return;
  }

  downloadBlob(fileName, blob);
};

const clearDownload = fileName => () => {
  delete canceledDownloads[fileName];
  delete inProgressDownloads[fileName];
};

const checkIfCreate = action => _.has(action, ['genericDownload.create']);
const checkIfCancel = action => _.has(action, ['genericDownload.cancel']);

const getExtraActionFields = action => _.omit(action, 'genericDownload.create', 'genericDownload.cancel', 'type');

export default store => next => action => {
  const result = next(action);

  if (checkIfCreate(action)) {
    const { fileName, fileUrl, successActionType, failureActionType } = action['genericDownload.create'];
    const isInProgress = inProgressDownloads[fileUrl];

    if (!isInProgress) {
      const clear = clearDownload(fileName);
      clear();

      inProgressDownloads[fileName] =
        fetch(fileUrl, fetchOptions).
          then(response => {
            if (canceledDownloads[fileUrl]) {
              clear();
              return;
            }

            if (response.status < 200 || response.status >= 300) {
              return response.json().then(reason => {
                throw reason.message;
              });
            }

            return response.blob().
              then(triggerDownload(fileUrl, fileName)).
              then(() => store.dispatch({ type: successActionType, ...getExtraActionFields(action) })).
              then(clear);
          }).catch(reason => {
            store.dispatch({ type: failureActionType, reason, ...getExtraActionFields(action) });
            clear();
          });
    } else if (canceledDownloads[fileUrl]) {
      delete canceledDownloads[fileUrl];
    }
  }

  if (checkIfCancel(action)) {
    const { fileName } = action['genericDownload.cancel'];
    canceledDownloads[fileName] = true;
  }

  return result;
};
