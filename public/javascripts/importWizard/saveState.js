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

export const STATE_SAVED = 'STATE_SAVED';
export function stateSaved(version) {
  return {
    type: STATE_SAVED,
    version
  };
}

export function update(lastSavedVersion: number = null, action) {
  switch (action.type) {
    case STATE_SAVED:
      return action.version;
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
    saveState(state.datasetId, state)
    .then((result) => {
      dispatch(stateSaved(result.version));
    })
    .catch((error) => {
      console.error('Failed to save import state', error);
    });
  };
}

function saveState(datasetId: string, state: Object): Promise<ImportSource> {
  const body = JSON.stringify({
    version: state.lastSavedVersion,
    fileId: fileIdOf(state),
    state: JSON.stringify(state)
  });

  return Server.socrataFetch(`/views/${datasetId}/import_sources`, {
    credentials: 'same-origin',
    method: 'POST',
    // Yes - because core only knows about text, we double stringify this :\
    body
  }).then((result) => {
    switch (result.status) {
      case 200:
      case 201:
      case 202:
        return result.json();

      default: {
        const error = `Unexpected status code received while saving operation: ${result.status}`;
        airbrake.notify({
          error: error,
          context: {component: 'Server'}
        });
        throw error;
      }
    }
  });
}
