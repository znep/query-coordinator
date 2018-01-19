import _ from 'lodash';
import uuid from 'uuid';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'datasetManagementUI/reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'datasetManagementUI/links/dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'datasetManagementUI/lib/http';
import { parseDate } from 'datasetManagementUI/lib/parseDate';
import { uploadFile } from 'datasetManagementUI/reduxStuff/actions/uploadFile';
import { browserHistory } from 'react-router';
import * as Links from 'datasetManagementUI/links/links';
import { normalizeCreateSourceResponse } from 'datasetManagementUI/lib/jsonDecoders';
import { subscribeToSource } from 'datasetManagementUI/reduxStuff/actions/subscriptions';
import { addNotification } from 'datasetManagementUI/reduxStuff/actions/notifications';
import { showFlashMessage } from 'datasetManagementUI/reduxStuff/actions/flashMessage';

export const CREATE_SOURCE = 'CREATE_SOURCE';
export const UPDATE_SOURCE = 'UPDATE_SOURCE';
export const CREATE_SOURCE_SUCCESS = 'CREATE_SOURCE_SUCCESS';
export const CREATE_UPLOAD_SOURCE_SUCCESS = 'CREATE_UPLOAD_SOURCE_SUCCESS';
export const SOURCE_UPDATE = 'SOURCE_UPDATE';

// CREATE SOURCE THUNKS
// Generic Create Source
function createSource(params, callParams, optionalCallId = null) {
  return async dispatch => {
    const callId = optionalCallId || uuid();

    const call = {
      operation: CREATE_SOURCE,
      callParams
    };

    dispatch(apiCallStarted(callId, call));

    try {
      const response = await socrataFetch(dsmapiLinks.sourceCreate(params), {
        method: 'POST',
        body: JSON.stringify(callParams)
      })
      .then(checkStatus)
      .then(getJson);

      const { resource } = response;

      dispatch(apiCallSucceeded(callId));

      return resource;
    } catch (err) {
      dispatch(apiCallFailed(callId, err));
      throw err;
    }
  };
}

export function createSourceSuccess(payload) {
  return {
    type: CREATE_SOURCE_SUCCESS,
    ...payload
  };
}

// View Source
export function createViewSource(params) {
  const callParams = {
    source_type: { type: 'view' }
  };
  // TODO: create revision channel and subscribe to it here or above to catch
  // os id updates
  return async dispatch => {
    try {
      const resource = await dispatch(createSource(params, callParams));
      const normalizedResource = normalizeCreateSourceResponse(resource);
      dispatch(createSourceSuccess(normalizedResource));
      return normalizedResource;
    } catch (err) {
      dispatch(showFlashMessage('error', I18n.show_uploads.flash_error_message));
    }
  };
}

export function createUploadSource(file, parseFile, params, callId) {
  return async dispatch => {
    const callParams = {
      source_type: { type: 'upload', filename: file.name },
      parse_options: { parse_source: parseFile }
    };

    let resource;

    try {
      resource = await dispatch(createSource(params, callParams, callId));

      dispatch(
        createUploadSourceSuccess(resource.id, resource.created_by, resource.created_at, resource.source_type)
      );

      dispatch(subscribeToSource(resource.id, params));

      const bytesSource = await dispatch(uploadFile(resource.id, file));

      if (!parseFile) {
        dispatch(sourceUpdate(bytesSource.resource.id, bytesSource.resource));
        browserHistory.push(Links.showBlobPreview(params, bytesSource.resource.id));
      }
    } catch (err) {
      if (resource && err.key && err.key === 'unparsable_file') {
        // this was not a parseable file type, even though we thought it would be
        // ex: zipfile but not shapefile, .json but not geojson
        // recover by telling DSMAPI to make a parse_source: false copy
        dispatch(dontParseSource(params, resource));
      } else if (err instanceof TypeError || err instanceof ProgressEvent) {
        // a network error occured on either createSource or uploadFile; we got
        // no response from the server via http or websocket. A TypeError is what
        // fetch returns if it cannot reach the network at all. A ProgressEvent
        // is what XMLHttpRequest if a network interruption occurs during the
        // sending of bytes.
        dispatch(showFlashMessage('error', I18n.notifications.connection_error_body));
      } else {
        dispatch(showFlashMessage('error', I18n.show_uploads.flash_error_message));
      }
    }
  };
}

export function createUploadSourceSuccess(id, createdBy, createdAt, sourceType, percentCompleted = 0) {
  return {
    type: CREATE_UPLOAD_SOURCE_SUCCESS,
    source: {
      id,
      source_type: sourceType,
      created_by: createdBy,
      created_at: parseDate(createdAt),
      percentCompleted
    }
  };
}

// URL Source
export function createURLSource(url, params) {
  const callParams = {
    source_type: {
      type: 'url',
      url
    }
  };

  return async dispatch => {
    const resource = await dispatch(createSource(params, callParams));

    dispatch(createUploadSourceSuccess(
      resource.id,
      resource.created_by,
      resource.created_at,
      resource.source_type
    ));

    dispatch(addNotification('source', resource.id));

    dispatch(subscribeToSource(resource.id, params));
  };
}

// UPDATE SOURCE THUNKS
function updateSource(params, source, changes) {
  return async dispatch => {
    const callId = uuid();

    const call = {
      operation: UPDATE_SOURCE,
      callParams: { sourceId: source.id }
    };

    dispatch(apiCallStarted(callId, call));

    try {
      const { resource } = await socrataFetch(dsmapiLinks.sourceUpdate(source.id), {
        method: 'POST',
        body: JSON.stringify(changes)
      })
      .then(checkStatus)
      .then(getJson);

      dispatch(apiCallSucceeded(callId));

      return resource;
    } catch (err) {
      dispatch(apiCallFailed(callId, err));
      throw err;
    }
  };
}

export function updateSourceParseOptions(params, source, parseOptions) {
  return async dispatch => {
    const resource = await dispatch(updateSource(params, source, { parse_options: parseOptions }));
    const normalizedResource = normalizeCreateSourceResponse(resource);
    dispatch(subscribeToSource(resource.id, params));
    dispatch(createSourceSuccess(normalizedResource));
    return normalizedResource;
  };
}

function dontParseSource(params, source) {
  return async dispatch => {
    const resource = await dispatch(updateSource(params, source, { parse_options: { parse_source: false } }));

    dispatch(subscribeToSource(resource.id, params));

    dispatch(
      createUploadSourceSuccess(
        resource.id,
        resource.created_by,
        resource.created_at,
        resource.source_type,
        100
      )
    );

    dispatch(addNotification('source', resource.id));

    browserHistory.push(Links.showBlobPreview(params, resource.id));

    return resource;
  };
}

export function sourceUpdate(sourceId, changes) {
  // oh ffs....we did this to ourselves.
  // TODO: fix this garbage
  if (_.isString(changes.created_at)) {
    changes.created_at = parseDate(changes.created_at);
  }
  if (_.isString(changes.finished_at)) {
    changes.finished_at = parseDate(changes.finished_at);
  }
  return {
    type: SOURCE_UPDATE,
    sourceId,
    changes
  };
}