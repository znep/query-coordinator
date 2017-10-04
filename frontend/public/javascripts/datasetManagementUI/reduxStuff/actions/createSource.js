import uuid from 'uuid';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'links/dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';
import { uploadFile } from 'reduxStuff/actions/uploadFile';
import { browserHistory } from 'react-router';
import * as Links from 'links/links';
import { normalizeCreateSourceResponse, normalizeInsertInputSchemaEvent } from 'lib/jsonDecoders';
import { subscribeToAllTheThings } from 'reduxStuff/actions/subscriptions';

export const CREATE_SOURCE = 'CREATE_SOURCE';
export const CREATE_SOURCE_SUCCESS = 'CREATE_SOURCE_SUCCESS';
export const CREATE_UPLOAD_SOURCE_SUCCESS = 'CREATE_UPLOAD_SOURCE_SUCCESS';

// Generic Create Source
function createSource(sourceType, params, callParams) {
  return dispatch => {
    const callId = uuid();

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

export function createSourceSuccess(payload) {
  return {
    type: CREATE_SOURCE_SUCCESS,
    ...payload
  };
}

// Create View Source
export function createViewSource(params) {
  const callParams = {
    source_type: { type: 'view' }
  };
  // TODO: handle error
  // TODO: create revision channel and subscribe to it here or above to catch
  // os id updates
  return dispatch => {
    return dispatch(createSource('view', params, callParams))
      .then(normalizeCreateSourceResponse)
      .then(resp => {
        dispatch(createSourceSuccess(resp));
        return resp;
      });
  };
}

// Create Upload Source
export function createUploadSource(file, params) {
  const callParams = {
    source_type: { type: 'upload', filename: file.name }
  };
  return dispatch => {
    return dispatch(createSource('upload', params, callParams)).then(resource => {
      // put source in store
      dispatch(
        createUploadSourceSuccess(resource.id, resource.created_by, resource.created_at, resource.source_type)
      );

      // listen on source channel, which puts other stuff into store
      dispatch(listenForOutputSchema(resource.id, params));

      // send bytes to created upload
      return dispatch(uploadFile(resource.id, file));
    });
  };
}

export function createUploadSourceSuccess(id, createdBy, createdAt, sourceType) {
  return {
    type: CREATE_UPLOAD_SOURCE_SUCCESS,
    source: {
      id,
      source_type: sourceType,
      created_by: createdBy,
      created_at: parseDate(createdAt),
      percentCompleted: 0
    }
  };
}

function listenForOutputSchema(sourceId, params) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`source:${sourceId}`);

    channel.on('insert_input_schema', is => {
      const [os] = is.output_schemas;

      const payload = normalizeInsertInputSchemaEvent(is, sourceId);

      dispatch(createSourceSuccess(payload));

      dispatch(subscribeToAllTheThings(is));

      browserHistory.push(Links.showOutputSchema(params, sourceId, is.id, os.id));
    });

    channel.join();
  };
}
