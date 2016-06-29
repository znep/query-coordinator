// @flow weak

/* everything having to do with making API calls, incl. turning parts of the Redux
model into the JSON needed for those calls */

import * as SharedTypes from './sharedTypes';
import * as ImportColumns from './components/importColumns';
import * as Metadata from './components/metadata';
import * as Utils from './utils';
import { goToPage } from './wizard';

import formurlencoded from 'form-urlencoded';
import _ from 'lodash';

declare var I18n: any;
type CurrentUser = { id: string }
export type Blist = { currentUser: CurrentUser }
declare var blist: Blist;

export function saveMetadataThenProceed() {
  return (dispatch, getState) => {
    const { navigation, metadata, datasetId } = getState();
    dispatch(goToPage('Working'));
    saveMetadataToViewsApi(datasetId, metadata).then(() => {
      dispatch(goToPage('Importing'));
      const onImportError = () => {
        dispatch(importError());
        dispatch(goToPage('Metadata'));
      };
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
    });
  };
}

function saveMetadataToViewsApi(datasetId, metadata) {
  return fetch(`/api/views/${datasetId}`, {
    method: 'PUT',
    credentials: 'same-origin',
    body: JSON.stringify(modelToViewParam(metadata))
  }).then((result) => {
    console.log(result);
  });
}

export function modelToViewParam(metadata) {
  return {
    name: metadata.name,
    description: metadata.description,
    category: metadata.category,
    tags: metadata.tags,
    metadata: {
      rowLabel: metadata.rowLabel,
      attributionLink: metadata.attributionLink,
      custom_fields: customMetadataModelToCoreView(metadata.customMetadata, false)
    },
    privateMetadata: {
      contactEmail: metadata.contactEmail,
      custom_fields: customMetadataModelToCoreView(metadata.customMetadata, true)
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
  return {
    name: view.name,
    description: view.description,
    category: view.category,
    tags: view.tags,
    rowLabel: view.metadata.rowLabel,
    attributionLink: view.metadata.attributionLink,
    customMetadata: coreViewToCustomMetadataModel(view),
    contactEmail: view.privateMetadata.contactEmail
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

type ImportProgress
  = { rowsImported: number }
  | { stage: string }

type NotificationStatus
  = 'Available'
  | 'InProgress'
  | 'NotificationSuccessful'
  | 'NotificationError'

type ImportStatus
  = { type: 'NotStarted' }
  | { type: 'Started' }
  | { type: 'InProgress', progress: ImportProgress }
  | { type: 'InProgress', progress: ImportProgress, notification: NotificationStatus }
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
export function importProgress(progress: ImportProgress, notificationsEnabled: boolean = false) {
  return {
    type: IMPORT_PROGRESS,
    progress,
    notificationsEnabled
  };
}

const IMPORT_ERROR = 'IMPORT_ERROR';
function importError(error: string = I18n.screens.import_pane.unknown_error) {
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

export const NOTIFICATION_STATUS = 'NOTIFICATION_STATUS';
export function notificationStatus(status: NotificationStatus) {
  return {
    type: NOTIFICATION_STATUS,
    status
  };
}

export function update(status: ImportStatus = initialImportStatus(), action): ImportStatus {
  switch (action.type) {
    case IMPORT_START:
      return {
        type: 'Started'
      };

    case IMPORT_PROGRESS:
      if (action.notificationsEnabled) {
        return {
          type: 'InProgress',
          progress: action.progress,
          notification: status.notification || 'Available'
        };
      } else {
        return {
          type: 'InProgress',
          progress: action.progress
        };
      }

    case NOTIFICATION_STATUS: {
      if (status.type === 'InProgress') {
        return {
          ...status,
          notificationStatus: action.status
        };
      } else {
        return status;
      }
    }

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

export function addNotificationInterest() {
  return (dispatch, getState) => {
    const state = getState();
    if (state.importStatus.notification === 'Available') {
      dispatch(notificationStatus('InProgress'));
      fetch(`/users/${blist.currentUser.id}/email_interests.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          eventTag: 'MAIL.IMPORT_ACTIVITY_COMPLETE',
          extraInfo: state.importStatus.progress.ticket
        })
      }).then((response) => {
        switch (response.status) {
          case 200:
            dispatch(notificationStatus('NotificationSuccessful'));
            break;
          default:
            dispatch(notificationStatus('NotificationError'));
            break;
        }
      }).catch(() => {
        dispatch(notificationStatus('NotificationError'));
      });
    }
  };
}

function importData(onError) {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(importStart());
    fetch('/api/imports2.json', {
      method: 'POST',
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
                  dispatch(importProgress({
                    rowsImported: progressResponse.details.progress,
                    ticket: ticket
                  }, true));
                }
              }, onError);
            }, POLL_INTERVAL_MS);
          });
          break;
        }

        default:
          onError();
          // TODO: AIRBRAKE THIS STUFF: EN-6942
          console.error('IMPORTING DATA FAILED', response);
      }
    }).catch(() => {
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
      method: 'POST',
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
              }, onError);
            }, POLL_INTERVAL_MS);
          });
          break;
        }

        default:
          // TODO: AIRBRAKE THIS STUFF: EN-6942
          console.error('IMPORTING DATA FAILED', response);
          onError();
      }
    }).catch((error) => {
      console.log(error);
      onError();
    });
  };
}

const POLL_INTERVAL_MS = 5000;


function pollUntilDone(ticket, dispatch, onProgress, onError) {
  fetch(`/api/imports2.json?ticket=${ticket}`, {
    credentials: 'same-origin'
  }).then((response) => {
    switch (response.status) {
      case 202:
        response.json().then((resp) => {
          onProgress(resp);
        });
        setTimeout(() => {
          pollUntilDone(ticket, dispatch, onProgress, onError);
        }, POLL_INTERVAL_MS);
        break;

      case 200:
        dispatch(importComplete());
        dispatch(goToPage('Finish'));
        break;

      default:
        console.error('response error: ', response);
        onError();
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
