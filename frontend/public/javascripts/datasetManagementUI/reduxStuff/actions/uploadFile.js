import uuid from 'uuid';
import * as dsmapiLinks from 'links/dsmapiLinks';
import {
  addNotification,
  removeNotificationAfterTimeout,
  updateNotification
} from 'reduxStuff/actions/notifications';
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
    // TODO: stop doing this for json files when EN-21134 is fixed
    return 'application/vnd.geo+json';
  }
  return fileType;
}

function xhrPromise(method, url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    let percent;

    if (xhr.upload) {
      xhr.upload.onprogress = evt => {
        percent = evt.loaded / evt.total * 100;
        onProgress(percent);
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
    xhr.setRequestHeader('X-File-Name', file.name);

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

export function uploadAttachment(revision, file) {
  return dispatch => {
    const callParams = {
      fourfour: revision.fourfour,
      revision_seq: revision.revision_seq
    };

    const callId = uuid();
    const subject = file.name;

    const call = {
      operation: UPLOAD_FILE,
      callParams
    };

    dispatch(apiCallStarted(callId, call));
    dispatch(addNotification('attachment', subject, { percent: 0, status: 'inProgress' }));

    const onProgress = (percent) => {
      dispatch(updateNotification(subject, { percent, status: 'inProgress' }));
    };

    return xhrPromise('POST', dsmapiLinks.addAttachment(revision), file, onProgress)
      .then(resp => JSON.parse(resp.responseText))
      .then(resp => {

        dispatch(apiCallSucceeded(callId));
        dispatch(updateNotification(subject, { status: 'success' }));
        dispatch(removeNotificationAfterTimeout(subject));

        return resp;
      })
      .catch(error => {
        dispatch(updateNotification(subject, { status: 'error', error }));
        dispatch(removeNotificationAfterTimeout(subject));
        dispatch(apiCallFailed(callId, error));
        throw error;
      });
  };
}

export function uploadFile(sourceId, file) {
  return dispatch => {
    const uploadUpdate = {
      id: sourceId
    };

    const callId = uuid();

    const call = {
      operation: UPLOAD_FILE,
      callParams: uploadUpdate
    };
    dispatch(apiCallStarted(callId, call));
    dispatch(addNotification('source', sourceId));

    const onProgress = (percent) => dispatch(updateProgress(sourceId, percent));

    return xhrPromise('POST', dsmapiLinks.sourceBytes(sourceId), file, onProgress)
      .then(resp => JSON.parse(resp.responseText))
      .then(resp => {
        dispatch(apiCallSucceeded(callId));
        return resp;
      })
      .catch(error => {
        dispatch(apiCallFailed(callId, error));
        throw error;
      });
  };
}
