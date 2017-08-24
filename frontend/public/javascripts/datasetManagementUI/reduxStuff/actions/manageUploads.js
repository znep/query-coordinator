import _ from 'lodash';
import { browserHistory } from 'react-router';
import uuid from 'uuid';
import * as Links from 'links';
import * as dsmapiLinks from 'dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';
import { editOutputSchema } from 'reduxStuff/actions/outputSchemas';
import { editTransform } from 'reduxStuff/actions/transforms';
import { editInputSchema } from 'reduxStuff/actions/inputSchemas';
import { editInputColumn } from 'reduxStuff/actions/inputColumns';
import { addNotification, removeNotificationAfterTimeout } from 'reduxStuff/actions/notifications';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'reduxStuff/actions/apiCalls';

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
export function createUpload(file, params) {
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

    return socrataFetch(dsmapiLinks.sourceCreate(params), {
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

        dispatch(listenForOutputSchema(resource.id, params));

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

function listenForOutputSchema(sourceId, params) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`source:${sourceId}`);

    channel.on('insert_input_schema', is => {
      // output_schemas is a list, but there will only be one at this point,
      // so we take the first
      const [os] = is.output_schemas;

      dispatch(insertInputSchema(is, sourceId));
      dispatch(subscribeToRowErrors(is));
      dispatch(subscribeToInputColumns(is));
      dispatch(subscribeToTotalRows(is));
      dispatch(listenForOutputSchemaSuccess(os, is));
      dispatch(subscribeToOutputSchema(os));
      dispatch(subscribeToTransforms(os));
      browserHistory.push(Links.showOutputSchema(params, sourceId, is.id, os.id));
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

export function listenForOutputSchemaSuccess(outputSchemaResponse, inputSchema) {
  const outputSchema = toOutputSchema(outputSchemaResponse);

  const { total_rows: totalRows } = inputSchema;

  // This is how transforms get into the redux store, which happens on loadRevision
  // and any time you create a new output schema (change a type, drop a column, etc.).
  // Notice we add a couple of properties here that are not in the API response.
  // The contiguous_rows_processed property in particular can be tricky, but it is
  // just the count of transforms on a column that DSMAPI has completed. We initialize
  // it here and then update it via socket later. Notice that if the transform is
  // completed, we know there is nothing left to process, so we just set it to
  // the totoal number of rows, which is just another way of representig that all
  // rows have been processed.
  const transforms = outputSchemaResponse.output_columns
    .map(oc => ({
      ...oc.transform,
      error_indices: [],
      contiguous_rows_processed: oc.transform.completed_at ? totalRows : null
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

export function subscribeToInputColumns(is) {
  return (dispatch, getState, socket) => {
    is.input_columns.forEach(ic => {
      const channel = socket.channel(`input_column:${ic.id}`);

      channel.on('update', updatedInputColumn => {
        dispatch(editInputColumn(ic.id, updatedInputColumn));
      });

      channel.join();
    });
  };
}

export function subscribeToTotalRows(is) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`input_schema:${is.id}`);

    channel.on('update', ({ total_rows }) =>
      dispatch(
        editInputSchema(is.id, {
          total_rows
        })
      )
    );

    channel.join();
  };
}

// Called on loadRevision path, upload path, manageColMetadata and showOutputSchema
// actions (e.g. addColumn, dropColumn, which create a new OS). The point of the
// channel is to inform us of DMAPI's progress on processing a column of data.
// The 'update' message will let us know if the processing is done or not. The
// max_ptr channel will give us a more detailed picture of that process, which
// allows us to create the progress bar.
export function subscribeToTransforms(os) {
  return (dispatch, getState, socket) => {
    os.output_columns.forEach(oc => {
      // == null catches null and undefined
      // we only want to subscribe to transforms that are NOT completed since,
      // if completed, we don't need to know about their progress
      // TODO: we need num_transform_errors on the rest reponse for this to work
      const channel = socket.channel(`transform:${oc.transform.id}`);

      const maxPtrHandler = ({ end_row_offset }) =>
        dispatch(
          editTransform(oc.transform.id, {
            contiguous_rows_processed: end_row_offset
          })
        );

      const updateHandler = ({ completed_at }) =>
        dispatch(
          editTransform(oc.transform.id, {
            completed_at
          })
        );

      const transformErrorHandler = ({ count }) =>
        dispatch(
          editTransform(oc.transform.id, {
            num_transform_errors: count
          })
        );

      channel.on('update', updateHandler);

      // DSMAPI sends these messages too fast for the frontend, which causes
      // too many rerenders and makes UI laggy, so gotta throttle
      channel.on('max_ptr', _.throttle(maxPtrHandler, PROGRESS_THROTTLE_TIME));

      channel.on('errors', _.throttle(transformErrorHandler, PROGRESS_THROTTLE_TIME));

      channel.join();

      // TODO: Delete everything til DELETE END after dsmapi pr goes in
      const oldChannel = socket.channel(`transform_progress:${oc.transform.id}`);

      oldChannel.on(
        'max_ptr',
        _.throttle(
          ({ end_row_offset }) =>
            dispatch(
              editTransform(oc.transform.id, {
                contiguous_rows_processed: end_row_offset
              })
            ),
          PROGRESS_THROTTLE_TIME
        )
      );

      oldChannel.on(
        'errors',
        _.throttle(
          ({ count }) =>
            dispatch(
              editTransform(oc.transform.id, {
                num_transform_errors: count
              })
            ),
          PROGRESS_THROTTLE_TIME
        )
      );

      oldChannel.join();
      // DELETE END
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
