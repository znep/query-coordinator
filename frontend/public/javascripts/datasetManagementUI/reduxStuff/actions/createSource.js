import _ from 'lodash';
import uuid from 'uuid';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'links/dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';
import { uploadFile } from 'reduxStuff/actions/uploadFile';
import { browserHistory } from 'react-router';
import * as Links from 'links/links';
import { normalizeCreateSourceResponse } from 'lib/jsonDecoders';
import { subscribeToSource } from 'reduxStuff/actions/subscriptions';
import { addNotification } from 'reduxStuff/actions/notifications';
import { showFlashMessage } from 'reduxStuff/actions/flashMessage';

export const CREATE_SOURCE = 'CREATE_SOURCE';
export const UPDATE_SOURCE = 'UPDATE_SOURCE';
export const CREATE_SOURCE_SUCCESS = 'CREATE_SOURCE_SUCCESS';
export const CREATE_UPLOAD_SOURCE_SUCCESS = 'CREATE_UPLOAD_SOURCE_SUCCESS';
export const SOURCE_UPDATE = 'SOURCE_UPDATE';

// Generic Create Source
function createSource(params, callParams, optionalCallId = null) {
  return dispatch => {
    const callId = optionalCallId || uuid();

    const call = {
      operation: CREATE_SOURCE,
      callParams
    };

    dispatch(apiCallStarted(callId, call));

    return socrataFetch(dsmapiLinks.sourceCreate(params), {
      method: 'POST',
      body: JSON.stringify(callParams)
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        const { resource } = resp;

        dispatch(apiCallSucceeded(callId));

        return resource;
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
        throw err;
      });
  };
}

function updateSource(params, source, changes) {
  return dispatch => {
    const callId = uuid();

    const call = {
      operation: UPDATE_SOURCE,
      callParams: { sourceId: source.id }
    };

    dispatch(apiCallStarted(callId, call));

    return socrataFetch(dsmapiLinks.sourceUpdate(source.id), {
      method: 'POST',
      body: JSON.stringify(changes)
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        const { resource } = resp;
        dispatch(apiCallSucceeded(callId));
        return resource;
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
        throw err;
      });
  };
}

function dontParseSource(params, source) {
  return dispatch => {
    return dispatch(updateSource(params, source, { parse_options: { parse_source: false } })).then(
      resource => {
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
      }
    );
  };
}

export function updateSourceParseOptions(params, source, parseOptions) {
  return dispatch => {
    return dispatch(updateSource(params, source, { parse_options: parseOptions }))
      .then(resource => {
        dispatch(subscribeToSource(resource.id, params));
        return resource;
      })
      .then(normalizeCreateSourceResponse)
      .then(normalized => {
        dispatch(createSourceSuccess(normalized));
        return normalized;
      });
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
  // TODO: handle error
  // TODO: create revision channel and subscribe to it here or above to catch
  // os id updates
  return dispatch => {
    return dispatch(createSource(params, callParams))
      .then(normalizeCreateSourceResponse)
      .then(resp => {
        dispatch(createSourceSuccess(resp));
        return resp;
      });
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
      } else {
        dispatch(showFlashMessage('error', I18n.show_uploads.flash_error_message));
      }
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

    createUploadSourceSuccess(resource.id, resource.created_by, resource.created_at, resource.source_type);

    dispatch(addNotification('source', resource.id));

    dispatch(subscribeToSource(resource.id, params));
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
