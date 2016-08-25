import airbrake from './airbrake';

import * as ST from './sharedTypes';
import * as IC from './components/importColumns';
import * as Server from './server';
import * as UploadFile from './components/uploadFile';
import * as DownloadFile from './components/downloadFile';


// match https://github.com/socrata/core/blob/246c2cf811e81a0ac780e391632e56d77b4f0696/unobtainium/src/main/java/com/blist/models/views/ImportSource.java#L198-L208
export type ImportSource = {
  translation: {
    version: number,
    content: {
      columns: IC.Translation,
      numHeaders: number
    }
  },
  fileName: string,
  fileId: string,
  scanResults: ST.Summary,
  viewId: number,
  importMode: ST.OperationName,
  uiSection: string,
  lastSuccessfulTranslation: string,
  lastSuccessfulTranslationVersion: number,
  version: number,
  createdAt: number,
  updatedAt: number
};


export const STATE_SAVED = 'STATE_SAVED';
export function stateSaved(importSource: ImportSource) {
  return {
    type: STATE_SAVED,
    importSource
  };
}


export function update(lastSavedVersion: number = null, action) {
  switch (action.type) {
    case STATE_SAVED:
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


export function saveOperation(datasetId: string, lastSavedVersion: number, operation: ST.OperationName): Promise<ImportSource> {
  return saveImportSource(datasetId, lastSavedVersion, {
    importMode: operation
  });
}


export function saveTransform(datasetId: string, lastSavedVersion: number, transform: IC.Transform): Promise<ImportSource> {
  return saveImportSource(datasetId, lastSavedVersion, {
    translation: {
      version: 1,
      content: {
        columns: transform.columns,
        numHeaders: transform.numHeaders
      }
    }
  });
}


function saveImportSource(datasetId: string, lastSavedVersion: number, body: Object): Promise<ImportSource> {
  if (lastSavedVersion) {
    body.version = lastSavedVersion;
  }
  return Server.socrataFetch(`/views/${datasetId}/import_sources`, {
    credentials: 'same-origin',
    method: 'POST',
    body: JSON.stringify(body)
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
        console.log('SIS error:', error);
        throw error;
      }
    }
  });
}
