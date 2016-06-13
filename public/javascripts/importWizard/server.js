/* everything having to do with making API calls, incl. turning parts of the Redux
model into the JSON needed for those calls */

import * as SharedTypes from './sharedTypes';
import * as ImportColumns from './components/importColumns';
import * as Working from './components/working';
import * as Importing from './components/importing';
import * as Metadata from './components/metadata';

import formurlencoded from 'form-urlencoded';


export function saveMetadata() {
  return (dispatch) => {
    dispatch(Metadata.metadataNext());
    setTimeout(() => {
      dispatch(Working.workingNext());
      dispatch(importData()); // TODO: or not, depending on operation
    }, 2000);
    // TODO: actually save metadata
  };
}


type ImportStatus
  = { type: 'NotStarted' }
  | { type: 'InProgress', rowsImported: number }
  | { type: 'Error', error: string }
  | { type: 'Complete' }


export function initialImportStatus(): ImportStatus {
  return {
    type: 'NotStarted'
  };
}


const IMPORT_START = 'IMPORT_START';
function importStart() {
  return {
    type: IMPORT_START
  };
}

const IMPORT_PROGRESS = 'IMPORT_PROGRESS';
function importProgress(rowsImported: number) {
  return {
    type: IMPORT_PROGRESS,
    rowsImported: rowsImported
  };
}

const IMPORT_ERROR = 'IMPORT_ERROR';
function importError(error: string) {
  return {
    type: IMPORT_ERROR,
    error: error
  };
}

export const IMPORT_COMPLETE = 'IMPORT_COMPLETE';
function importComplete() {
  return {
    type: IMPORT_COMPLETE
  };
}


export function update(status: ImportStatus = initialImportStatus(), action): ImportStatus {
  switch (action.type) {
    case IMPORT_START:
      return {
        type: 'InProgress',
        rowsImported: 0
      };

    case IMPORT_PROGRESS:
      return {
        type: 'InProgress',
        rowsImported: action.rowsImported
      };

    case IMPORT_ERROR:
      return {
        type: 'Error',
        error: action.error
      };

    case IMPORT_COMPLETE:
      return {
        type: 'Complete'
      };

    default:
      return status;
  }
}


function importData() {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(importStart());
    fetch('/api/imports2.json', {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'same-origin',
      body: formurlencoded({
        name: state.upload.fileName,
        translation: transformToImports2Translation(state.transform),
        blueprint: JSON.stringify(transformToBlueprint(state.transform)),
        fileId: state.upload.progress.fileId
      })
    }).then((response) => {
      switch (response.status) {
        case 200:
          dispatch(Importing.importingNext());
          break;

        case 202: {
          response.json().then((resp) => {
            const ticket = resp.ticket;
            setTimeout(() => {
              pollUntilDone(ticket, dispatch);
            }, POLL_INTERVAL_MS);
          });
          break;
        }

        default:
          console.error('IMPORTING DATA FAILED', response);
      }
    });
  };
}


const POLL_INTERVAL_MS = 5000;


function pollUntilDone(ticket, dispatch) {
  fetch(`/api/imports2.json?ticket=${ticket}`, {
    credentials: 'same-origin'
  }).then((response) => {
    switch (response.status) {
      case 202:
        response.json().then((resp) => {
          const rowsImported = resp.details.progress;
          dispatch(importProgress(rowsImported));
        });
        setTimeout(() => {
          pollUntilDone(ticket, dispatch);
        }, POLL_INTERVAL_MS);
        break;

      case 200:
        dispatch(importComplete());
        break;

      default:
        response.json().then((resp) => {
          dispatch(importError(JSON.stringify(resp))); // TODO human-readable error message
        });
    }
  });
}


function transformToImports2Translation(transform: ImportColumns.Transform): string {
  function resultColumnToJs(resultColumn: ImportColumns.ResultColumn): string {
    // TODO: transforms, location columns, composite columns
    return `col${resultColumn.sourceColumn.index + 1}`;
  }
  return `[${transform.map(resultColumnToJs).join(', ')}]`;
}


type Blueprint = {
  skip: number,
  columns: Array<{name: string, datatype: SharedTypes.TypeName}>
}


function transformToBlueprint(transform: ImportColumns.Transform): Blueprint {
  return {
    skip: 1, // TODO get this from model
    columns: transform.map((resultColumn) => ({
      name: resultColumn.name,
      datatype: resultColumn.chosenType
    }))
  };
}
