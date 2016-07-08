// @flow weak

/* everything having to do with making API calls, incl. turning parts of the Redux
model into the JSON needed for those calls */

import * as SharedTypes from './sharedTypes';
import * as ImportColumns from './components/importColumns';
import * as Metadata from './components/metadata';
import * as Utils from './utils';
import { goToPage } from './wizard';
import licenses from 'licenses';
const invertedLicenses = _.invert(licenses);
import airbrake from './airbrake';

import formurlencoded from 'form-urlencoded';
import _ from 'lodash';

const authenticityMetaTag = document.querySelector('meta[name=csrf-token]');
export const authenticityToken: string = authenticityMetaTag === null
  ? ''
  : authenticityMetaTag.attributes.getNamedItem('content').value;

export const appToken: string = 'U29jcmF0YS0td2VraWNrYXNz0';

declare var I18n: any;
type CurrentUser = { id: string }
export type Blist = { currentUser: CurrentUser }
declare var blist: Blist;

export function saveMetadataThenProceed() {
  return (dispatch) => {
    dispatch(goToPage('Working'));
    dispatch(saveMetadataToViewsApi()).
      then(() => {
        dispatch(proceedFromMetadataPane());
      });
  };
}

export function saveMetadataToViewsApi() {
  return (dispatch, getState) => {
    dispatch(Metadata.metadataSaveStart());
    const { datasetId, metadata } = getState();
    return socrataFetch(`/api/views/${datasetId}`, {
      method: 'PUT',
      credentials: 'same-origin',
      body: JSON.stringify(modelToViewParam(metadata))
    }).then(checkStatus)
      .then((response) => {
        console.log(response);
        dispatch(Metadata.metadataSaveComplete(metadata.contents));
        dispatch(Metadata.updateLastSaved(metadata));
      }).then(() => {
        dispatch(updatePrivacy(datasetId, metadata, metadata.contents.privacySettings));
      }).catch((err) => {
        dispatch(Metadata.metadataSaveError(err));
      });
  };
}

export function proceedFromMetadataPane() {
  return (dispatch, getState) => {
    const { navigation } = getState();
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
  };
}

export function updatePrivacy(datasetId, metadata, currentPrivacy) {
  return (dispatch) => {
    const apiPrivacy = currentPrivacy === 'public' ? 'public.read' : 'private';

    return socrataFetch(`/api/views/${datasetId}?accessType=WEBSITE&method=setPermission&value=${apiPrivacy}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': authenticityToken,
        'X-App-Token': appToken
      }
    }).then((result) => {
      console.log(result);
      dispatch(Metadata.metadataSaveComplete(metadata.contents));
      dispatch(Metadata.updateLastSaved(metadata));
    });
  };
}

export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

const defaultFetchOptions = {
  headers: {
    'X-CSRF-Token': authenticityToken,
    'X-App-Token': appToken
  }
};

export function socrataFetch(path, options): Promise {
  // only need to add in authenticityToken for non-GET requests
  const mergedOptions = (!_.isUndefined(options.method) && options.method.toUpperCase() !== 'GET')
    ? _.merge(options, defaultFetchOptions)
    : options;
  return fetch(path, mergedOptions);
}

export function modelToViewParam(metadata) {
  return {
    name: metadata.contents.name,
    attributionLink: metadata.license.sourceLink,
    attribution: metadata.license.attribution,
    description: metadata.contents.description,
    category: metadata.contents.category,
    tags: metadata.contents.tags,
    metadata: {
      rowLabel: metadata.contents.rowLabel,
      attributionLink: metadata.contents.mapLayer,
      custom_fields: customMetadataModelToCoreView(metadata.contents.customMetadata, false)
    },
    privateMetadata: {
      contactEmail: metadata.contents.contactEmail,
      custom_fields: customMetadataModelToCoreView(metadata.contents.customMetadata, true)
    },
    licenseId: metadata.license.licenseId,
    license: licenseToView(metadata.license)
  };
}

export function licenseToView(license) {
  const licenseId = license.licenseId;
  const name = invertedLicenses[licenseId];

  const licenseList = blistLicenses.map((mapLicense) => {
    if (_.has(mapLicense, 'licenses')) {
      return mapLicense.licenses;
    } else {
      return mapLicense;
    }
  });

  const flattenedLicenses = [].concat.apply([], licenseList);
  const match = _.find(flattenedLicenses, (l) => {
    return l.id === licenseId;
  });

  return {
    name: name,
    termsLink: match.terms_link || '',
    logoUrl: match.logo || ''
  };
}

export function coreViewToModel(view) {
  const contents = coreViewContents(view);
  const license = coreViewLicense(view);
  return {
    nextClicked: false,
    contents: contents,
    lastSaved: {
      lastSavedContents: _.cloneDeep(contents),
      lastSavedLicense: _.cloneDeep(license)
    },
    apiCall: { type: 'In Progress' },
    license: license
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

function coreViewLicense(view) {
  const id = view.licenseId;
  const name = view.license.name;
  const titles = blistLicenses.map(obj => (obj.name));
  if (titles.indexOf(name) >= 0) {
    return {
      licenseId: id,
      licenseName: name,
      licensing: '',
      sourceLink: view.attributionLink,
      attribution: view.attribution
    };
  } else {
    const title = _.find(titles, (t) => {
      return name.indexOf(t) === 0;
    });

    const licensing = name.slice(title.length).trim();

    return {
      licenseId: id,
      licenseName: title,
      licensing: licensing,
      sourceLink: view.attributionLink,
      attribution: view.attribution
    };
  }
}

export function coreViewContents(view) {
  return {
    name: view.name,
    description: view.description,
    category: view.category,
    tags: view.tags,
    rowLabel: view.metadata.rowLabel,
    mapLayer: view.metadata.attributionLink,
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
          notification: action.status
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
      socrataFetch(`/users/${blist.currentUser.id}/email_interests.json`, {
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
    socrataFetch('/api/imports2.json', {
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
          airbrake.notify({
            error: `Unexpected status code received while importing: ${response.status}`,
            context: { component: 'Server' }
          });
          onError();
      }
    }).catch((err) => {
      airbrake.notify({
        error: err,
        context: { component: 'Server' }
      });
      onError();
    });
  };
}

function importGeospatial(onError) {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(importStart());
    socrataFetch('/api/imports2.json?method=shapefile', {
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
  socrataFetch(`/api/imports2.json?ticket=${ticket}`, {
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


function sourceColumnExpr(sourceColumn: SharedTypes.SourceColumn) {
  return `col${sourceColumn.index + 1}`;
}


function compositeColumnComponent(component: string | SharedTypes.SourceColumn) {
  return _.isObject(component)
    ? sourceColumnExpr(component)
    : '"' + component.replace(/"/g, '\\"') + '"';
}


export function transformToImports2Translation(importTransform: ImportColumns.Transform): string {
  function resultColumnToJs(resultColumn: ImportColumns.ResultColumn): string {
    // TODO: location columns
    const columnSource =
      resultColumn.columnSource.type === 'SingleColumn'
        ? sourceColumnExpr(resultColumn.columnSource.sourceColumn)
        : resultColumn.columnSource.components.map(compositeColumnComponent).join(' + ');
    return _.reduce(resultColumn.transforms, (transformed, transform) => {
      switch (transform.type) {
        case 'title':
          return `title(${transformed})`;

        case 'upper':
          return `upper(${transformed})`;

        case 'lower':
          return `lower(${transformed})`;

        case 'toStateCode':
          return `toStateCode(${transformed})`;

        case 'findReplace': {
          const findText = transform.regex ? Utils.escapeRegex(transform.findText) : transform.findText;
          const replaceString = `/${findText}/g` + (transform.caseSensitive ? '' : 'i');
          return `(${transformed}).replace(${replaceString}, "${transform.replaceText}")`;
        }
        default:
          console.log('error: unknown transform type ', transform.type);
          break;

      }
    }, columnSource);
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
