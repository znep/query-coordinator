import _ from 'lodash';
import { push } from 'react-router-redux';
import uuid from 'uuid';
import * as Links from 'links';
import * as dsmapiLinks from 'dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';
import { editOutputSchema } from 'actions/outputSchemas';
import { editTransform } from 'actions/transforms';
import { editInputSchema } from 'actions/inputSchemas';
import { addNotification, removeNotificationAfterTimeout } from 'actions/notifications';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'actions/apiCalls';

export const INSERT_INPUT_SCHEMA = 'INSERT_INPUT_SCHEMA';
export const LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS = 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS';
export const UPLOAD_FILE = 'UPLOAD_FILE';
export const UPLOAD_FILE_SUCCESS = 'UPLOAD_FILE_SUCCESS';
export const UPLOAD_FILE_FAILURE = 'UPLOAD_FILE_FAILURE';
export const CREATE_UPLOAD = 'CREATE_UPLOAD';
export const CREATE_UPLOAD_SUCCESS = 'CREATE_UPLOAD_SUCCESS';
export const UPDATE_PROGRESS = 'UPDATE_PROGRESS';

// Each render takes approx 10ms, so this should be plenty slow to allow rendering
// to catch up even on slower machines
const PROGRESS_THROTTLE_TIME = 250;

function xhrPromise(method, url, file, sourceId, dispatch) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    let percent;

    if (xhr.upload) {
      xhr.upload.onprogress = evt => {
        percent = evt.loaded / evt.total * 100;
        dispatch(updateProgress(sourceId, percent));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr);
      } else {
        let error;
        try {
          error = JSON.parse(xhr.response);
        } catch (_err) {
          error = { message: xhr.response };
        }
        reject(error);
      }
    };

    xhr.onerror = error => {
      reject(error);
    };

    xhr.setRequestHeader('Content-type', file.type);

    xhr.send(file);
  });
}

function updateProgress(sourceId, percentCompleted) {
  return {
    type: UPDATE_PROGRESS,
    sourceId,
    percentCompleted
  };
}

// convention should be:
// verbNoun for async action creators
// verbNounSuccess and/or verbNounFailure for non-async action creators that update store based on api response
// verbNoun for ui action creators
export function createUpload(file, fourfour) {
  return dispatch => {
    const callId = uuid();

    const sourceType = {
      type: 'upload',
      filename: file.name
    };

    const call = {
      operation: CREATE_UPLOAD,
      params: {
        source_type: sourceType
      }
    };

    dispatch(apiCallStarted(callId, call));

    return socrataFetch(dsmapiLinks.sourceCreate, {
      method: 'POST',
      body: JSON.stringify({
        source_type: sourceType
      })
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        const { resource } = resp;

        dispatch(apiCallSucceeded(callId));
        dispatch(
          createUploadSuccess(resource.id, resource.created_by, resource.created_at, resource.source_type)
        );

        dispatch(listenForOutputSchema(resource.id, fourfour));

        return dispatch(uploadFile(resource.id, file));
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
      });
  };
}

function createUploadSuccess(id, createdBy, createdAt, sourceType) {
  return {
    type: CREATE_UPLOAD_SUCCESS,
    id,
    source_type: sourceType,
    created_by: createdBy,
    created_at: parseDate(createdAt)
  };
}

export function uploadFile(sourceId, file) {
  return (dispatch, getState) => {
    const uploadUpdate = {
      id: sourceId
    };

    const callId = uuid();

    const call = {
      operation: UPLOAD_FILE,
      params: uploadUpdate
    };

    dispatch(apiCallStarted(callId, call));

    dispatch(addNotification('upload', callId, sourceId));

    return xhrPromise('POST', dsmapiLinks.sourceBytes(sourceId), file, sourceId, dispatch)
      .then(resp => JSON.parse(resp.responseText))
      .then(resp => {
        dispatch(uploadFileSuccess(sourceId, new Date(), resp.resource.id, resp.resource.total_rows));

        dispatch(apiCallSucceeded(callId));

        const notificationId = getState().ui.notifications.filter(
          notification => notification.callId === callId
        )[0].id;

        dispatch(removeNotificationAfterTimeout(notificationId));

        return resp;
      })
      .catch(err => {
        dispatch(uploadFileFailure(sourceId));
        dispatch(apiCallFailed(callId, err));
      });
  };
}

function uploadFileSuccess(sourceId, finishedAt, inputSchemaId, totalRows) {
  return {
    type: UPLOAD_FILE_SUCCESS,
    sourceId,
    finishedAt,
    inputSchemaId,
    totalRows
  };
}

function uploadFileFailure(sourceId) {
  return {
    type: UPLOAD_FILE_FAILURE,
    sourceId,
    failedAt: Date.now()
  };
}

function listenForOutputSchema(sourceId) {
  return (dispatch, getState, socket) => {
    const { routing } = getState().ui;

    const channel = socket.channel(`source:${sourceId}`);

    channel.on('insert_input_schema', is => {
      // it seems to be a quirk of dsmapi that it broadcasts a list of os here
      // there should only every be one, so we just take the first one here
      const [os] = is.output_schemas;

      dispatch(insertInputSchema(is, sourceId));
      dispatch(subscribeToRowErrors(is));
      dispatch(subscribeToTotalRows(is));
      dispatch(listenForOutputSchemaSuccess(os));
      dispatch(subscribeToOutputSchema(os));
      dispatch(subscribeToTransforms(os));
      dispatch(push(Links.showOutputSchema(sourceId, is.id, os.id)(routing.location)));
    });

    channel.join();
  };
}

function toOutputSchema(os) {
  return {
    id: os.id,
    input_schema_id: os.input_schema_id,
    error_count: os.error_count,
    created_at: os.created_at ? parseDate(os.created_at) : null,
    created_by: os.created_by
  };
}

export function listenForOutputSchemaSuccess(outputSchemaResponse) {
  const outputSchema = toOutputSchema(outputSchemaResponse);

  const transforms = outputSchemaResponse.output_columns
    .map(oc => ({
      ...oc.transform,
      error_indices: []
    }))
    .reduce(
      (acc, transform) => ({
        ...acc,
        [transform.id]: transform
      }),
      {}
    );

  const outputColumns = outputSchemaResponse.output_columns.reduce((acc, oc) => {
    const ocWithTransform = {
      ..._.omit(oc, ['transform']),
      transform_id: oc.transform.id
    };

    return {
      ...acc,
      [oc.id]: ocWithTransform
    };
  }, {});

  const outputSchemaColumns = outputSchemaResponse.output_columns.reduce((acc, oc) => {
    const id = `${outputSchemaResponse.id}-${oc.id}`;

    return {
      ...acc,
      [id]: {
        id,
        output_schema_id: outputSchemaResponse.id,
        output_column_id: oc.id,
        is_primary_key: oc.is_primary_key
      }
    };
  }, {});

  return {
    type: LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS,
    outputSchema,
    transforms,
    outputColumns,
    outputSchemaColumns
  };
}

export function insertInputSchema(is, sourceId) {
  const inputSchemas = {
    [is.id]: {
      id: is.id,
      name: is.name,
      total_rows: is.total_rows,
      source_id: sourceId
    }
  };

  const inputColumns = is.input_columns.reduce(
    (acc, ic) => ({
      ...acc,
      [ic.id]: ic
    }),
    {}
  );

  return {
    type: INSERT_INPUT_SCHEMA,
    inputSchemas,
    inputColumns
  };
}

export function subscribeToRowErrors(is) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`row_errors:${is.id}`);

    channel.on('errors', ({ errors }) =>
      dispatch(
        editInputSchema(is.id, {
          num_row_errors: errors
        })
      )
    );

    channel.join();
  };
}

export function subscribeToTotalRows(is) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`input_schema:${is.id}`);

    channel.on('update', ({ total_rows }) =>
      dispatch(editInputSchema(is.id, {
        total_rows
      }))
    );

    channel.join();
  };
}

export function subscribeToTransforms(os) {
  return (dispatch, getState, socket) => {
    os.output_columns.forEach(oc => {
      const channel = socket.channel(`transform_progress:${oc.transform.id}`);

      channel.on('max_ptr', _.throttle(({ end_row_offset }) =>
        dispatch(
          editTransform(oc.transform.id, {
            contiguous_rows_processed: end_row_offset
          })
        ),
        PROGRESS_THROTTLE_TIME
      ));

      channel.on('errors', _.throttle(({ count }) =>
        dispatch(
          editTransform(oc.transform.id, {
            num_transform_errors: count
          })
        ),
        PROGRESS_THROTTLE_TIME
      ));

      channel.join();
    });
  };
}

export function subscribeToOutputSchema(os) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`output_schema:${os.id}`);

    channel.on('update', newOS => {
      const updatedOS = {
        ...os,
        ...newOS
      };

      dispatch(editOutputSchema(os.id, updatedOS));
    });

    channel.join();
  };
}
