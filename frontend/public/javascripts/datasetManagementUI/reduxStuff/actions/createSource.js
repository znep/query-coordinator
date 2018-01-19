import _ from 'lodash';
import uuid from 'uuid';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed
} from 'datasetManagementUI/reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'datasetManagementUI/links/dsmapiLinks';
import { socrataFetch, checkStatus, getJson, getError } from 'datasetManagementUI/lib/http';
import { parseDate } from 'datasetManagementUI/lib/parseDate';
import { uploadFile } from 'datasetManagementUI/reduxStuff/actions/uploadFile';
import { browserHistory } from 'react-router';
import * as Links from 'datasetManagementUI/links/links';
import {
  normalizeCreateSourceResponse,
  normalizeInsertInputSchemaEvent
} from 'datasetManagementUI/lib/jsonDecoders';
import { subscribeToAllTheThings } from 'datasetManagementUI/reduxStuff/actions/subscriptions';
import {
  addNotification,
  removeNotificationAfterTimeout
} from 'datasetManagementUI/reduxStuff/actions/notifications';
import { showFlashMessage } from 'datasetManagementUI/reduxStuff/actions/flashMessage';

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
      .catch(getError)
      .catch(err => {
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
    return dispatch(updateSource(params, source, { parse_options: { parse_source: false } }))
      .then(resource => {
        dispatch(listenForInputSchema(resource.id, params));
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
        return resource;
      });
  };
}

export function updateSourceParseOptions(params, source, parseOptions) {
  return dispatch => {
    return dispatch(updateSource(params, source, { parse_options: parseOptions }))
      .then(resource => {
        dispatch(listenForInputSchema(resource.id, params));
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
      }).catch(err => {
        console.error(err);
        dispatch(apiCallFailed(null, err));
      });
  };
}

// Upload Source
export function createUploadSource(file, shouldParseFile, params, callId) {
  const callParams = {
    source_type: { type: 'upload', filename: file.name },
    parse_options: { parse_source: shouldParseFile }
  };
  return dispatch => {
    return dispatch(createSource(params, callParams, callId)).then(resource => {
      // put source in store
      dispatch(
        createUploadSourceSuccess(resource.id, resource.created_by, resource.created_at, resource.source_type)
      );

      // listen on source channel
      dispatch(listenForInputSchema(resource.id, params));

      return dispatch(uploadFile(resource.id, file))
      .then(bytesSource => {
        if (!shouldParseFile) {
          dispatch(sourceUpdate(bytesSource.resource.id, bytesSource.resource));
        }
        return bytesSource;
      }).catch(err => {
        if (err.key && err.key === 'unparsable_file') {
          // this was not a parseable file type, even though we thought it would be
          // ex: zipfile but not shapefile, .json but not geojson
          // recover by telling DSMAPI to make a parse_source: false copy
          dispatch(dontParseSource(params, resource));
        } else {
          dispatch(apiCallFailed(callId, err));
          throw err;
        }
      });
    }).catch(() => {
      dispatch(showFlashMessage('error', I18n.show_uploads.flash_error_message));
    });
  };
}

// URL Source
export function createURLSource(url, params, shouldParseFile = true) {
  const callParams = {
    source_type: { type: 'url', url },
    parse_options: { parse_source: shouldParseFile }
  };
  const callId = uuid();

  return dispatch => {
    return dispatch(createSource(params, callParams, callId)).then(resource => {
      dispatch(
        createUploadSourceSuccess(resource.id, resource.created_by, resource.created_at, resource.source_type)
      );

      dispatch(addNotification('source', resource.id));
      dispatch(listenForInputSchema(resource.id, params));
    }).catch(err => {
      if (shouldParseFile && err.body && err.body.key && err.body.key === 'unparsable_file') {
        // the content type at the end of this url indicates its not parsable
        // recover by telling DSMAPI to make a parse_source: false with the same url
        return dispatch(createURLSource(url, params, false));
      } else {
        dispatch(apiCallFailed(callId, err));
        throw err;
      }
    });
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

function sourceUpdate(sourceId, changes) {
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


function listenForInputSchema(sourceId, params) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`source:${sourceId}`);
    channel.on('insert_input_schema', (is) => {
      const [os] = is.output_schemas;

      const payload = normalizeInsertInputSchemaEvent(is, sourceId);

      dispatch(createSourceSuccess(payload));

      dispatch(subscribeToAllTheThings(is));

      browserHistory.push(Links.showOutputSchema(params, sourceId, is.id, os.id));
    });

    channel.on('update', changes => {
      dispatch(sourceUpdate(sourceId, changes));

      // This isn't a great place to do this - figure out a nicer way
      // TODO: aaurhgghiguhuhgghghgh
      if (changes.finished_at) {
        dispatch(removeNotificationAfterTimeout(sourceId));
        const source = getState().entities.sources[sourceId];

        if (source && source.parse_options && !source.parse_options.parse_source) {
          browserHistory.push(Links.showBlobPreview(params, sourceId));
        }
      }
    });

    return channel.join();
  };
}
