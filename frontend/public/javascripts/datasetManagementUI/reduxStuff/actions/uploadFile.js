import uuid from 'uuid';
import * as dsmapiLinks from 'dsmapiLinks';
import { addNotification, removeNotificationAfterTimeout } from 'reduxStuff/actions/notifications';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'reduxStuff/actions/apiCalls';

export const UPLOAD_FILE = 'UPLOAD_FILE';
export const UPLOAD_FILE_SUCCESS = 'UPLOAD_FILE_SUCCESS';
export const UPLOAD_FILE_FAILURE = 'UPLOAD_FILE_FAILURE';
export const UPDATE_PROGRESS = 'UPDATE_PROGRESS';

function getContentType(fileType) {
  // Substitute .json for .geojson content type
  // because that's the only json variant we support -
  // if the user has a file `foo.json`, we'll translate
  // the content type to geojson for them
  if (fileType.indexOf('application/json') > -1) {
    return 'application/vnd.geo+json';
  }
  return fileType;
}

function xhrPromise(method, url, file, sourceId, dispatch) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    let percent;

    if (xhr.upload) {
      xhr.upload.onprogress = evt => {
        percent = evt.loaded / evt.total * 100;
        dispatch(updateProgress(sourceId, percent));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr);
      } else {
        let error;
        try {
          error = JSON.parse(xhr.response);
        } catch (_err) {
          error = { message: xhr.response };
        }
        reject(error);
      }
    };

    xhr.onerror = error => {
      reject(error);
    };

    xhr.setRequestHeader('Content-type', getContentType(file.type));

    xhr.send(file);
  });
}

function updateProgress(sourceId, percentCompleted) {
  return {
    type: UPDATE_PROGRESS,
    sourceId,
    percentCompleted
  };
}

export function uploadFile(sourceId, file) {
  return (dispatch, getState) => {
    const uploadUpdate = {
      id: sourceId
    };

    const callId = uuid();

    const call = {
      operation: UPLOAD_FILE,
      callParams: uploadUpdate
    };

    dispatch(apiCallStarted(callId, call));
    dispatch(addNotification('upload', callId, sourceId));

    return xhrPromise('POST', dsmapiLinks.sourceBytes(sourceId), file, sourceId, dispatch)
      .then(resp => JSON.parse(resp.responseText))
      .then(resp => {
        dispatch(uploadFileSuccess(sourceId, new Date()));

        dispatch(apiCallSucceeded(callId));

        const notificationId = getState().ui.notifications.filter(
          notification => notification.callId === callId
        )[0].id;

        dispatch(removeNotificationAfterTimeout(notificationId));

        return resp;
      })
      .catch(err => {
        dispatch(uploadFileFailure(sourceId));
        dispatch(apiCallFailed(callId, err));
      });
  };
}

function uploadFileSuccess(sourceId, finishedAt) {
  return {
    type: UPLOAD_FILE_SUCCESS,
    sourceId,
    finishedAt
  };
}

function uploadFileFailure(sourceId) {
  return {
    type: UPLOAD_FILE_FAILURE,
    sourceId,
    failedAt: Date.now()
  };
}
