// @flow weak

/* everything having to do with making API calls, incl. turning parts of the Redux
model into the JSON needed for those calls */

/* global blistLicenses */

import * as SharedTypes from './sharedTypes';
import * as ImportColumns from './components/importColumns';
import * as Metadata from './components/metadata';
import * as Utils from './utils';
import { goToPage, goToPreviousPage } from './wizard';
import licenses from 'licenses';
const invertedLicenses = _.invert(licenses);
import airbrake from './airbrake';
import 'whatwg-fetch';

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
    const proceed = () => {
      dispatch(proceedFromMetadataPane());
    };
    dispatch(saveMetadataToViewsApi()).then(proceed);

  };
}

export function saveMetadataToViewsApi() {
  return (dispatch, getState) => {
    dispatch(Metadata.metadataSaveStart());
    const { datasetId, metadata, navigation } = getState();
    return socrataFetch(`/api/views/${datasetId}`, {
      method: 'PUT',
      credentials: 'same-origin',
      body: JSON.stringify(modelToViewParam(metadata, navigation))
    }).then((response) => {
      return response.json().then((body) => {
        if (response.status >= 200 && response.status < 300) {
          dispatch(Metadata.metadataSaveComplete(metadata.contents));
          dispatch(Metadata.updateLastSaved(metadata));
          dispatch(updatePrivacy(datasetId, metadata, metadata.contents.privacySettings));
        } else {
          dispatch(Metadata.metadataSaveError(body));
        }
      });
    }).catch((err) => {
      dispatch(Metadata.metadataSaveError(err));
    });
  };
}


export function proceedFromMetadataPane() {
  return (dispatch, getState) => {
    const { navigation, metadata } = getState();
    if (metadata.apiCall.type === 'Error') {
      dispatch(goToPreviousPage('Metadata'));
    } else {
      const onImportError = () => {
        dispatch(importError());
        dispatch(goToPreviousPage('Metadata'));
      };
      switch (navigation.operation) {
        case 'UPLOAD_DATA':
          dispatch(importData(onImportError));
          break;
        case 'UPLOAD_GEO':
          dispatch(importGeospatial(onImportError));
          break;
        case 'CREATE_FROM_SCRATCH':
          dispatch(goToPage('Finish'));
          break;
        case 'LINK_EXTERNAL':
          dispatch(goToPage('Finish'));
          break;
        case 'UPLOAD_BLOB':
          dispatch(goToPage('Finish'));
          break;
        default:
          console.error('Unknown operation!', navigation.operation);
      }
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
    }).then(() => {
      dispatch(Metadata.metadataSaveComplete(metadata.contents));
      dispatch(Metadata.updateLastSaved(metadata));
    });
  };
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


function hrefMetadata(href, meta) {
  return _.extend({}, meta, {
    accessPoints: {
      com: href
    },
    availableDisplayTypes: ['href'],
    renderTypeConfig: {
      visible: {
        href: true
      }
    }
  });
}

function blobMetadata(meta) {
  return _.extend({}, meta, {
    availableDisplayTypes: ['blob'],
    renderTypeConfig: {
      visibile: {
        blob: true
      }
    }
  });
}

function viewMetadata({href, rowLabel, mapLayer, customMetadata, displayType}) {
  const attributionLink = _.isNull(mapLayer) ? {} : { attributionLink: mapLayer };

  const meta = {
    ...attributionLink,
    rowLabel: rowLabel,
    custom_fields: customMetadataModelToCoreView(customMetadata, false)
  };

  if (href) {
    return hrefMetadata(href, meta);
  } else if (displayType === 'blob') {
    return blobMetadata(meta);
  } else {
    return meta;
  }
}

export function modelToViewParam(metadata) {
  const model = {
    name: metadata.contents.name,
    attributionLink: metadata.license.sourceLink,
    attribution: metadata.license.attribution,
    description: metadata.contents.description,
    category: metadata.contents.category,
    tags: metadata.contents.tags,
    metadata: viewMetadata(metadata.contents),
    privateMetadata: {
      contactEmail: metadata.contents.contactEmail,
      custom_fields: customMetadataModelToCoreView(metadata.contents.customMetadata, true)
    },
    displayType: metadata.contents.displayType
  };

  const license = metadata.license;
  if (license.licenseId !== '') {
    return {
      ...model,
      licenseId: license.licenseId,
      license: licenseToView(license)
    };
  }

  return model;
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
  const license = view.licenseId
                  ? coreViewLicense(view)
                  : Metadata.emptyLicense();
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
    return _.fromPairs(pairs);
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
    displayType: view.displayType,
    href: _.has(view.metadata, 'accessPoints')
            ? view.metadata.accessPoints.com
            : '',
    privacySettings: _.has(view, 'grants')
                        ? 'public'
                        : 'private'
  };
}

function getCustomMetadataValueFromView(view, privateField, fieldSetName, field) {
  if (privateField) {
    if (_.has(view.privateMetadata.custom_fields, fieldSetName) && _.has(view.privateMetadata.custom_fields[fieldSetName], field)) {
      return view.privateMetadata.custom_fields[fieldSetName][field];
    }
  } else {
    if (_.has(view.metadata.custom_fields, fieldSetName) && _.has(view.metadata.custom_fields[fieldSetName], field)) {
      return view.metadata.custom_fields[fieldSetName][field];
    }
  }
  return '';
}

function coreViewToCustomMetadataModel(view) {
  return _.mapValues(Metadata.defaultCustomData(), (fieldSet, fieldSetName) => (
    fieldSet.map(({field, privateField}) => (
      {
        field: field,
        value: getCustomMetadataValueFromView(view, privateField, fieldSetName, field),
        privateField: privateField
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
  function getFileId({upload, download}) {
    if (upload && upload.progress) return upload.progress.fileId;
    if (download) return download.fileId;
  }

  function getFileName({upload, download}) {
    if (upload.fileName) return upload.fileName;
    if (download.fileName) return download.fileName;
  }

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
        name: getFileName(state),
        translation: transformToImports2Translation(state.transform.columns),
        blueprint: JSON.stringify(transformToBlueprint(state.transform.columns)),
        fileId: getFileId(state),
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
        fileId: state.upload.progress.fileId,
        draftViewUid: state.datasetId
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
    }).catch(() => onError());
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

function locationSourceColumnExpr(sourceColumn: string | SharedTypes.SourceColumn) {
  if (!sourceColumn) {
    return '';
  } else {
    return sourceColumnExpr(sourceColumn);
  }
}

function getHumanAddress(components) {
  function getLocationComponent(component) {
    if (component.isColumn) {
      return locationSourceColumnExpr(component.column.sourceColumn);
    } else if (component.text) {
      return `"${component.text}"`;
    } else {
      return null;
    }
  }

  // Localized mutation for the win!
  var humanAddress = '{';

  const street = locationSourceColumnExpr(components.street.sourceColumn);
  if (street) {
    humanAddress += `"street":${street},`;
  }

  const city = getLocationComponent(components.city);
  if (city) {
    humanAddress += `"city":${city},`;
  }

  const state = getLocationComponent(components.state);
  if (state) {
    humanAddress += `"state":${state},`;
  }

  const zip = getLocationComponent(components.zip);
  if (zip) {
    humanAddress += `"zip":${zip},`;
  }

  humanAddress += '}';

  return humanAddress.replace(/,}$/, '}'); // Solve fencepost problem.
}

export function getLocationColumnSource(resultColumn) {
  const components = resultColumn.columnSource.components;
  if (resultColumn.columnSource.components.isMultiple) {
    const lat = sourceColumnExpr(components.lat.sourceColumn);
    const lon = sourceColumnExpr(components.lon.sourceColumn);

    // Can't use JSON.stringify because lat and lon need to be unquoted.
    return `{"latitude":${lat},"longitude":${lon},"human_address":${getHumanAddress(components)}}`;
  } else {
    return locationSourceColumnExpr(components.singleSource.sourceColumn);
  }
}

function getColumnSource(resultColumn) {
  switch (resultColumn.columnSource.type) {
    case 'SingleColumn':
      return sourceColumnExpr(resultColumn.columnSource.sourceColumn);
    case 'CompositeColumn':
      return resultColumn.columnSource.components.map(compositeColumnComponent).join(' + ');
    case 'LocationColumn':
      return getLocationColumnSource(resultColumn);
  }
}

export function transformToImports2Translation(importTransform: ImportColumns.Transform): string {
  function resultColumnToJs(resultColumn: ImportColumns.ResultColumn): string {
    const columnSource = getColumnSource(resultColumn);

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
