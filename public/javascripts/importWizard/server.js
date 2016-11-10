// @flow weak

/* everything having to do with making API calls, incl. turning parts of the Redux
model into the JSON needed for those calls */

/* global blist */
/* global blistLicenses */

import * as SharedTypes from './sharedTypes';
import * as ImportColumns from './components/importColumns';
import * as Metadata from './components/metadata';
import * as Utils from './utils';
import * as LocationColumns from './components/importColumns/locationColumn';
import { rerenderSaveButton } from './saveState';
import * as ImportStatus from './importStatus';
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

export const SHOW_RESPONSE_MS = 1000;
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

// TODO: refactor common elements of this and the fetch in saveState.js to a shared method
export function saveMetadataToViewsApi(privacyChanged) {
  return (dispatch, getState) => {
    dispatch(Metadata.metadataSaveStart());
    const { datasetId, metadata, navigation } = getState();
    return socrataFetch(`/api/views/${datasetId}`, {
      method: 'PUT',
      credentials: 'same-origin',
      body: JSON.stringify(modelToViewParam(metadata, navigation))
    }).then((response) => {

      if (privacyChanged) {
        dispatch(savePrivacySettings());
      }

      return response.json().then((body) => {
        if (response.status >= 200 && response.status < 300) {
          dispatch(Metadata.metadataSaveComplete(metadata.contents));
          dispatch(Metadata.updateLastSaved(metadata));
        } else {
          dispatch(Metadata.metadataSaveError(body));
        }
      }).catch(() => {
        // if there's a 502, it's returned as html which causes a json parse error
        // use the statusText instead
        dispatch(Metadata.metadataSaveError(response.statusText));
      });
    }).catch((err) => {
      dispatch(Metadata.metadataSaveError(err));
    }).then(() => {
      setTimeout(() => {
        dispatch(rerenderSaveButton());
      }, SHOW_RESPONSE_MS);
    });
  };
}

// TODO: refactor common elements of this and the fetch in saveState.js to a shared method
export function savePrivacySettings() {
  return (dispatch, getState) => {
    const { datasetId, metadata } = getState();
    dispatch(Metadata.metadataPrivacySaveStart());
    const apiPrivacy = metadata.privacySettings === 'public' ? 'public.read' : 'private';

    return socrataFetch(`/api/views/${datasetId}?accessType=WEBSITE&method=setPermission&value=${apiPrivacy}`, {
      method: 'PUT',
      credentials: 'same-origin'
    }).then((response) => {
      if (response.status >= 200 && response.status < 300) {
        dispatch(Metadata.metadataPrivacySaveComplete(metadata.contents));
        dispatch(Metadata.updatePrivacyLastSaved(metadata.privacySettings));
      } else {
        dispatch(Metadata.metadataPrivacySaveError(response.statusText));
      }
    }).catch((err) => {
      dispatch(Metadata.metadataPrivacySaveError(err));
    }).then(() => {
      setTimeout(() => {
        dispatch(rerenderSaveButton());
      }, SHOW_RESPONSE_MS);
    });
  };
}

export function proceedFromMetadataPane() {
  return (dispatch, getState) => {
    const { navigation, metadata } = getState();
    if (metadata.apiCall.type === 'Error') {
      dispatch(goToPreviousPage('Metadata'));
    } else {
      const onImportError = (error) => {
        dispatch(importError(error));
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

  if (_.isString(metadata.license.sourceLink) && metadata.license.sourceLink.length > 0) {
    // don't send an empty attributionLink to core.
    model.attributionLink = metadata.license.sourceLink;
  }

  const license = metadata.license;
  if (license.licenseId === '') {
    return {
      ...model,
      licenseId: null,
      license: null
    };
  } else {
    return {
      ...model,
      licenseId: license.licenseId,
      license: licenseToView(license)
    };
  }
}

export function licenseToView(license) {
  const licenseId = license.licenseId;
  const name = invertedLicenses[licenseId];

  const licenseList = blistLicenses.map((mapLicense) => {
    if (_.has(mapLicense, 'licenses')) {
      return mapLicense.licenses;
    } else {
      return [mapLicense];
    }
  });

  const flattenedLicenses = _.flatten(licenseList);
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
  const privacySettings = _.has(view, 'grants') ? 'public' : 'private';
  return {
    nextClicked: false,
    contents: contents,
    lastSaved: {
      lastSavedContents: _.cloneDeep(contents),
      lastSavedLicense: _.cloneDeep(license),
      lastSavedPrivacySettings: privacySettings
    },
    apiCall: { type: 'NotStarted' },
    license: license,
    privacySettings: privacySettings,
    privacyApiCall: { type: 'NotStarted' }
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
  if (view.licenseId && view.license) {
    const id = view.licenseId;
    const name = view.license.name;
    const titles = blistLicenses.map(obj => (obj.name));
    if (titles.indexOf(name) >= 0) {
      // sub-license, e.g. 'Creative Commons Attribution | Noncommercial 3.0 Unported'
      return {
        licenseId: id,
        licenseName: name,
        licensing: '',
        sourceLink: view.attributionLink,
        attribution: view.attribution
      };
    } else {
      // top-level license, e.g. 'UK Open Government Licence v3'
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
  } else {
    return {
      ...Metadata.emptyLicense(),
      attribution: view.attribution,
      sourceLink: view.attributionLink || ''
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
            : ''
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

const IMPORT_START = 'IMPORT_START';
function importStart() {
  return {
    type: IMPORT_START
  };
}

const IMPORT_PROGRESS = 'IMPORT_PROGRESS';
export function importProgress(progress: ImportStatus.ImportProgress, notificationsEnabled: boolean = false) {
  return {
    type: IMPORT_PROGRESS,
    progress,
    notificationsEnabled
  };
}

const IMPORT_ERROR = 'IMPORT_ERROR';
function importError(error) {
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
export function notificationStatus(status: ImportStatus.NotificationStatus) {
  return {
    type: NOTIFICATION_STATUS,
    status
  };
}

const POLL_SCHEDULED = 'POLL_SCHEDULED';
function pollScheduled(interval) {
  return {
    type: POLL_SCHEDULED,
    interval
  };
}

export function update(status, action): ImportStatus.ImportStatus {
  status = status || ImportStatus.initialImportStatus();
  switch (action.type) {
    case IMPORT_START:
      return {
        type: 'Started'
      };

    case POLL_SCHEDULED:
      return {
        ...status,
        interval: action.interval
      };
    case IMPORT_PROGRESS:
      if (action.notificationsEnabled) {
        return {
          ...status,
          type: 'InProgress',
          progress: action.progress,
          notification: status.notification || 'Available'
        };
      } else {
        return {
          ...status,
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
    dispatch(goToPage('Importing'));
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
        draftViewUid: state.datasetId,
        nbe: blist.feature_flags.ingress_strategy === 'nbe'
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
            dispatch(pollTicket(ticket, onError));
          });
          break;
        }
        case 500:
          onError({
            type: 'generic',
            params: {}
          });
          break;

        default:
          airbrake.notify({
            error: `Unexpected status code received while importing: ${response.status}`,
            context: { component: 'Server' }
          });
          response.json().then((resp) => {
            onError(resp.failureDetails);
          });
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
    dispatch(goToPage('Importing'));
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
            dispatch(pollTicket(ticket, onError));
          });
          break;
        }

        case 500:
          onError({
            type: 'generic'
          });
          break;

        default:
          // TODO: AIRBRAKE THIS STUFF: EN-6942
          console.error('IMPORTING DATA FAILED', response);
          response.json().then((json) => {
            onError(json.failureDetails);
          });
      }
    }).catch(() => onError());
  };
}

const POLL_INTERVAL_MS = 5000;

export function resumePolling(ticket) {
  return (dispatch, getState) => {
    const onImportError = (error) => {
      dispatch(importError(error));
      dispatch(goToPreviousPage('Metadata'));
    };
    return pollTicket(ticket, onImportError)(dispatch, getState);
  };
}

export function pollTicket(ticket, onError) {
  return (dispatch) => {
    const interval = setTimeout(() => {
      pollUntilDone(ticket, dispatch, (progressResponse) => {
        if (progressResponse.details && !_.isUndefined(progressResponse.details.progress)) {
          dispatch(importProgress({
            rowsImported: progressResponse.details.progress,
            stage: progressResponse.details.stage,
            ticket: ticket
          }, true));
        }
      }, onError);
    }, POLL_INTERVAL_MS);
    dispatch(pollScheduled(interval));
  };
}


export function pollUntilDone(ticket, dispatch, onProgress, onError) {
  socrataFetch(`/api/imports2.json?ticket=${ticket}`, {
    credentials: 'same-origin'
  }).then((response) => {
    switch (response.status) {
      case 202: {
        response.json().then(onProgress);
        const interval = setTimeout(() => {
          pollUntilDone(ticket, dispatch, onProgress, onError);
        }, POLL_INTERVAL_MS);
        dispatch(pollScheduled(interval));
        break;
      }
      case 200:
        dispatch(importComplete());
        dispatch(goToPage('Finish'));
        break;

      default:
        response.json().then((error) => {
          console.error('response error: ', error);
          onError(error.failureDetails);
          // ^^ will pass in undefined if `failureDetails` key is not there, defaulting to a
          // generic error message
        });
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

function getHumanAddress(components: LocationColumns.LocationSource) {
  function columnOrTextExpr(fieldName: string): ?string {
    const columnOrText = components[fieldName];
    if (columnOrText.isColumn) {
      if (columnOrText.column === null) {
        return null;
      } else {
        return `"${fieldName}":${sourceColumnExpr(columnOrText.column)}`;
      }
    } else {
      return `"${fieldName}":"${columnOrText.text.replace(/"/g, '\\"')}"`;
    }
  }

  const componentStrings = _.compact([
    components.street ? `"address":${sourceColumnExpr(components.street)}` : null,
    columnOrTextExpr('city'),
    columnOrTextExpr('state'),
    columnOrTextExpr('zip')
  ]);

  return '{' + componentStrings.join(',') + '}';
}

function getLatLon(latitude, longitude) {
  if (latitude && longitude) {
    const lat = sourceColumnExpr(latitude);
    const lon = sourceColumnExpr(longitude);

    return `"latitude":${lat},"longitude":${lon},`;
  } else {
    return '';
  }
}

export function getLocationColumnSource(resultColumn) {
  const components = resultColumn.columnSource.locationComponents;
  if (components.isMultiple) {
    const latLon = getLatLon(components.latitude, components.longitude);

    // Can't use JSON.stringify because lat and lon need to be unquoted.
    return `{${latLon}"human_address":${getHumanAddress(components)}}`;
  } else if (components.singleSource !== null) {
    return sourceColumnExpr(components.singleSource);
  } else {
    return '""';
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
