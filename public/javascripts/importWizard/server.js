/* everything having to do with making API calls, incl. turning parts of the Redux
model into the JSON needed for those calls */

import * as SharedTypes from './sharedTypes';
import * as ImportColumns from './components/importColumns';
import * as Metadata from './components/metadata';
import * as Utils from './utils';
import { goToPage } from './wizard';

import formurlencoded from 'form-urlencoded';
import _ from 'lodash';

export function saveMetadataThenProceed() {
  return (dispatch, getState) => {
    const { navigation, metadata, datasetId } = getState();
    saveMetadataToViewsApi(datasetId, metadata).
      then(checkStatus).
      then((response) => {
        console.log(response);
        dispatch(goToPage('Working'));
        updatePrivacy(datasetId, metadata.lastSaved.privacySettings, metadata.contents.privacySettings).
          then(() => {
            const onImportError = () => {
              dispatch(importError());
              dispatch(goToPage('Metadata'));
            };
            dispatch(Metadata.metadataSaveComplete(metadata.contents));
            switch (navigation.operation) {
              case 'UploadData':
                dispatch(importData(onImportError));
                break;
              case 'UploadGeospatial':
                dispatch(importGeospatial(onImportError));
                break;
              case 'CreateFromScratch':
                dispatch(goToPage('Finish'));
                break;
              default:
                console.error('Unkown operation!', navigation.operation);
            }
          }).
          catch((err) => {
            dispatch(Metadata.metadataSaveError(err));
          });
      }).
      catch((err) => {
        dispatch(Metadata.metadataSaveError(err));
      });
  };
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

function saveMetadataToViewsApi(datasetId, metadata) {
  return fetch(`/api/views/${datasetId}`, {
    method: 'PUT',
    credentials: 'same-origin',
    body: JSON.stringify(modelToViewParam(metadata))
  // }).then((result) => {
  //   console.log(result);
  //   if (result.statusText === 'Bad Request') {
  //     dispatch(Metadata.metadataSaveError(result.statusText));
  //   }
  });
}

export function modelToViewParam(metadata) {
  return {
    name: metadata.contents.name,
    description: metadata.contents.description,
    category: metadata.contents.category,
    tags: metadata.contents.tags,
    metadata: {
      rowLabel: metadata.contents.rowLabel,
      attributionLink: metadata.contents.attributionLink,
      custom_fields: customMetadataModelToCoreView(metadata.contents.customMetadata, false)
    },
    privateMetadata: {
      contactEmail: metadata.contents.contactEmail,
      custom_fields: customMetadataModelToCoreView(metadata.contents.customMetadata, true)
    }
  };
}

export function customMetadataModelToCoreView(customMetadata, isPrivate: boolean) {
  return _.mapValues(customMetadata, (fieldSet) => {
    const pairs = fieldSet.
      filter(field => (isPrivate === field.privateField)).
      map(({field, value}) => ([field, value]));
    return Utils.fromPairs(pairs);
  });
}

export function coreViewToModel(view) {
  const contents = coreViewContents(view);
  return {
    nextClicked: false,
    contents: contents,
    lastSaved: contents,
    apiCall: {}
  };
}

export function coreViewContents(view) {
  return {
    name: view.name,
    description: view.description,
    category: view.category,
    tags: view.tags,
    rowLabel: view.metadata.rowLabel,
    attributionLink: view.metadata.attributionLink,
    customMetadata: coreViewToCustomMetadataModel(view),
    contactEmail: view.privateMetadata.contactEmail,
    privacySettings: _.has(view, 'grants')
                        ? 'public'
                        : 'private'
  };
}

function coreViewToCustomMetadataModel(view) {
  return _.mapValues(Metadata.defaultCustomData(), (fieldSet, fieldSetName) => (
    fieldSet.map(({field, privateField}) => (
      {
        field: field,
        privateField: privateField,
        value: privateField
          ? view.privateMetadata.custom_fields[fieldSetName][field]
          : view.metadata.custom_fields[fieldSetName][field]
      }
    ))
  ));
}

export function updatePrivacy(datasetId, lastPrivacy, currentPrivacy) {
  const apiPrivacy = currentPrivacy === 'public' ? 'public.read' : 'private';

  return fetch(`/api/views/${datasetId}?accessType=WEBSITE&method=setPermission&value=${apiPrivacy}`, {
    method: 'PUT',
    credentials: 'same-origin'
  }).then((result) => {
    console.log(result);
  });
}

type ImportProgress
  = { rowsImported: number }
  | { stage: string }

type ImportStatus
  = { type: 'NotStarted' }
  | { type: 'Started' }
  | { type: 'InProgress', progress: ImportProgress }
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
function importProgress(progress: ImportProgress) {
  return {
    type: IMPORT_PROGRESS,
    progress
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
        type: 'Started'
      };

    case IMPORT_PROGRESS:
      return {
        type: 'InProgress',
        ...action.progress
      };

    case IMPORT_ERROR:
      return {
        type: 'Error',
        error: _.isUndefined(action.error) ?
          I18n.screens.import_pane.unknown_error :
          action.error
      };

    case IMPORT_COMPLETE:
      return {
        type: 'Complete'
      };

    default:
      return status;
  }
}


function importData(onError) {
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
        translation: transformToImports2Translation(state.transform.columns),
        blueprint: JSON.stringify(transformToBlueprint(state.transform.columns)),
        fileId: state.upload.progress.fileId,
        draftViewUid: state.datasetId
      })
    }).then((response) => {
      switch (response.status) {
        case 200:
          dispatch(importComplete());
          dispatch(goToPage('Finish'));
          break;

        case 202: {
          response.json().then((resp) => {
            const ticket = resp.ticket;
            setTimeout(() => {
              pollUntilDone(ticket, dispatch, (progressResponse) => {
                if (progressResponse.details && !_.isUndefined(progressResponse.details.progress)) {
                  dispatch(importProgress({rowsImported: progressResponse.details.progress}));
                }
              });
            }, POLL_INTERVAL_MS);
          });
          break;
        }

        default:
          onError();
          // TODO: AIRBRAKE THIS STUFF: EN-6942
          console.error('IMPORTING DATA FAILED', response);
      }
    })['catch'](() => {
      // TODO: airbrake these errors (EN-6942)
      onError();
    });
  };
}

function importGeospatial(onError) {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(importStart());
    fetch('/api/imports2.json?method=shapefile', {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'same-origin',
      body: formurlencoded({
        name: state.upload.fileName,
        blueprint: JSON.stringify({layers: _.map(state.layers, (layer) => ({name: layer.name}))}),
        fileId: state.upload.progress.fileId
      })
    }).then((response) => {
      switch (response.status) {
        case 200:
          dispatch(goToPage('Finish'));
          break;

        case 202: {
          response.json().then((resp) => {
            const ticket = resp.ticket;
            setTimeout(() => {
              pollUntilDone(ticket, dispatch, (progressResponse) => {
                if (progressResponse.details && !_.isUndefined(progressResponse.details.stage)) {
                  dispatch(importProgress({stage: progressResponse.details.stage}));
                }
              });
            }, POLL_INTERVAL_MS);
          });
          break;
        }

        default:
          // TODO: AIRBRAKE THIS STUFF: EN-6942
          console.error('IMPORTING DATA FAILED', response);
          onError();
      }
    })['catch']((error) => {
      console.log(error);
      onError();
    });
  };
}

const POLL_INTERVAL_MS = 5000;


function pollUntilDone(ticket, dispatch, onProgress) {
  fetch(`/api/imports2.json?ticket=${ticket}`, {
    credentials: 'same-origin'
  }).then((response) => {
    switch (response.status) {
      case 202:
        response.json().then((resp) => {
          onProgress(resp);
        });
        setTimeout(() => {
          pollUntilDone(ticket, dispatch, onProgress);
        }, POLL_INTERVAL_MS);
        break;

      case 200:
        dispatch(importComplete());
        dispatch(goToPage('Finish'));
        break;

      default:
        response.json().then((resp) => {
          dispatch(importError(JSON.stringify(resp))); // TODO human-readable error message
        });
    }
  });
}

export function transformToImports2Translation(importTransform: ImportColumns.Transform): string {
  function resultColumnToJs(resultColumn: ImportColumns.ResultColumn): string {
    // TODO: location columns, composite columns
    let transformed = `col${resultColumn.sourceColumn.index + 1}`;
    _.forEach(resultColumn.transforms, (transform) => {
      switch (transform.type) {
        case 'title': {
          transformed = `title(${transformed})`;
          break;
        }
        case 'upper': {
          transformed = `upper(${transformed})`;
          break;
        }
        case 'lower': {
          transformed = `lower(${transformed})`;
          break;
        }
        case 'toStateCode': {
          transformed = `toStateCode(${transformed})`;
          break;
        }
        case 'findReplace': {
          let replaceString = `/${transform.findText}/g`;
          if (!transform.caseSensitive) {
            replaceString += 'i';
          }

          transformed = `(${transformed}).replace(${replaceString}, "${transform.replaceText}")`;
          break;
        }
        default: {
          console.log('error: unknown transform type ', transform.type);
          break;
        }
      }
    });
    return transformed;
  }
  return `[${importTransform.map(resultColumnToJs).join(',')}]`;
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
