import airbrake from './airbrake';
import * as Server from './server';
import * as UploadFile from './components/uploadFile';
import * as DownloadFile from './components/downloadFile';

export type ImportSource = {
  state: string,
  fileId: string,
  version: number,
  createdAt: number,
  updatedAt: number
};

export const STATE_SAVE_STARTED = 'STATE_SAVE_STARTED';
export function stateSaveStarted() {
  return {
    type: STATE_SAVE_STARTED
  };
}

export const STATE_SAVE_COMPLETE = 'STATE_SAVE_COMPLETE';
export function stateSaveComplete(importSource: ImportSource) {
  return {
    type: STATE_SAVE_COMPLETE,
    importSource
  };
}

export const STATE_SAVE_ERROR = 'STATE_SAVE_ERROR';
export function stateSaveError(error) {
  return {
    type: STATE_SAVE_ERROR,
    error
  };
}

// rerender the view to compare resultsTimestamp
export const RERENDER_SAVE_BUTTON = 'RERENDER_SAVE_BUTTON';
export function rerenderSaveButton() {
  return {
    type: RERENDER_SAVE_BUTTON
  };
}

export function update(lastSavedVersion: number = null, action) {
  switch (action.type) {
    case STATE_SAVE_COMPLETE:
      return action.importSource.version;
    case DownloadFile.FILE_DOWNLOAD_COMPLETE:
    case UploadFile.FILE_UPLOAD_COMPLETE:
      if (!_.isUndefined(action.newImportSourceVersion)) {
        return action.newImportSourceVersion;
      } else {
        return lastSavedVersion;
      }

    default:
      return lastSavedVersion;
  }
}

/**
 * Get the fileId from the state
 * the uploadFile and downloadFile reducers listen to each other's events
 * and clear their state when the other one happens - so if an upload happens,
 * download will clear itself, and vice versa.
 */
function fileIdOf({upload, download}) {
  return _.get(download, 'fileId') || _.get(upload, 'progress.fileId');
}

export function save() {
  return (dispatch, getState) => {
    dispatch(stateSaveStarted());
    const state = getState();
    saveState(state.datasetId, state, dispatch);
  };
}

function notifyAirbrake(status) {
  const error = `Unexpected status code received while saving operation: ${status}`;
  airbrake.notify({
    error,
    context: {component: 'Server'}
  });
}

// TODO: refactor common elements of this and the fetches in server.js to a shared method
function saveState(datasetId: string, state: Object, dispatch): Promise<ImportSource> {
  const body = JSON.stringify({
    version: state.lastSavedVersion,
    fileId: fileIdOf(state),
    state: JSON.stringify(state)
  });
  Server.socrataFetch(`/views/${datasetId}/import_sources`, {
    credentials: 'same-origin',
    method: 'POST',
    // Yes - because core only knows about text, we double stringify this :\
    body
  })
  .then((result) => {
    result.json().then((responseBody) => {
      if (result.status >= 200 && result.status < 300) {
        dispatch(stateSaveComplete(responseBody));
      } else {
        notifyAirbrake(result.status);
        dispatch(stateSaveError(responseBody));
      }
    })
    .catch(() => {
      // if there's a 502, it's returned as html which causes a json parse error
      // use the statusText instead
      dispatch(stateSaveError(result.statusText));
    });
  })
  .catch((error) => {
    dispatch(stateSaveError(error));
  })
  .then(() => {
    setTimeout(() => {
      dispatch(rerenderSaveButton());
    }, Server.SHOW_RESPONSE_MS);
  });
}
