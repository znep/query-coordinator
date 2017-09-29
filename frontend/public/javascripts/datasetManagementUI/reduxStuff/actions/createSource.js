import uuid from 'uuid';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';
import { uploadFile } from 'reduxStuff/actions/uploadFile';
import { browserHistory } from 'react-router';
import * as Links from 'links';
import { normalizeCreateSourceResponse } from 'lib/jsonDecoders';
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

function createSourceSuccess(payload) {
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
  return dispatch => {
    dispatch(createSource('view', params, callParams))
      .then(normalizeCreateSourceResponse)
      .then(resp => dispatch(createSourceSuccess(resp)));
  };
}

// Create Upload Source
export function createUploadSource(file, params) {
  const callParams = {
    source_type: { type: 'upload', filename: file.name }
  };
  return dispatch => {
    dispatch(createSource('upload', params, callParams)).then(resource => {
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
    id,
    source_type: sourceType,
    created_by: createdBy,
    created_at: parseDate(createdAt),
    percentCompleted: 0
  };
}

function listenForOutputSchema(sourceId, params) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`source:${sourceId}`);

    channel.on('insert_input_schema', is => {
      const [os] = is.output_schemas;

      // A little janky, but just mimicking the structure of the create source
      // http response from dsmapi so we can use all the same json parsing functions
      // The 'schemas' part of that response is an array of objects with the exact
      // same structure as the 'is' payload of this channel message
      const resource = {
        id: sourceId,
        type: 'fake',
        created_by: is.created_by,
        schemas: [is]
      };

      const payload = normalizeCreateSourceResponse(resource);

      dispatch(createSourceSuccess(payload));

      dispatch(subscribeToAllTheThings(is));

      browserHistory.push(Links.showOutputSchema(params, sourceId, is.id, os.id));
    });

    channel.join();
  };
}
