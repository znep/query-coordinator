import _ from 'lodash';
import { push } from 'react-router-redux';
import uuid from 'uuid';
import * as Links from 'links';
import * as dsmapiLinks from 'dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';
import { joinChannel } from 'actions/channels';
import { editOutputSchema } from 'actions/outputSchemas';
import { editTransform } from 'actions/transforms';
import { editInputSchema } from 'actions/inputSchemas';
import { addNotification, removeNotificationAfterTimeout } from 'actions/notifications';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'actions/apiCalls';

export const INSERT_INPUT_SCHEMA = 'INSERT_INPUT_SCHEMA';
export const POLL_FOR_OUTPUT_SCHEMA_SUCCESS = 'POLL_FOR_OUTPUT_SCHEMA_SUCCESS';
export const UPLOAD_FILE = 'UPLOAD_FILE';
export const UPLOAD_FILE_SUCCESS = 'UPLOAD_FILE_SUCCESS';
export const CREATE_UPLOAD = 'CREATE_UPLOAD';
export const CREATE_UPLOAD_SUCCESS = 'CREATE_UPLOAD_SUCCESS';
export const UPDATE_PROGRESS = 'UPDATE_PROGRESS';

function xhrPromise(method, url, file, uploadId, dispatch) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    let percent;

    if (xhr.upload) {
      xhr.upload.onprogress = evt => {
        percent = evt.loaded / evt.total * 100;
        dispatch(updateProgress(uploadId, percent));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        res(xhr);
      } else {
        rej({
          xhr,
          percent
        });
      }
    };

    xhr.onerror = () => {
      rej({
        xhr,
        percent
      });
    };

    xhr.setRequestHeader('Content-type', file.type);

    xhr.send(file);
  });
}

function updateProgress(uploadId, percentCompleted) {
  return {
    type: UPDATE_PROGRESS,
    uploadId,
    percentCompleted
  };
}

// convention should be:
// verbNoun for async action creators
// verbNounSuccess and/or verbNounFailure for non-async action creators that update store based on api response
// verbNoun for ui action creators
export function createUpload(file) {
  return (dispatch, getState) => {
    const { ui } = getState();

    const callId = uuid();

    const call = {
      operation: CREATE_UPLOAD,
      params: {
        filename: file.name
      }
    };

    dispatch(apiCallStarted(callId, call));

    return socrataFetch(dsmapiLinks.uploadCreate, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name
      })
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        const { resource } = resp;

        dispatch(apiCallSucceeded(callId));

        dispatch(createUploadSuccess(resource.id, resource.created_by, resource.created_at, file.name));

        dispatch(push(Links.showUpload(resource.id)(ui.routing.location)));

        return Promise.all([
          dispatch(uploadFile(resource.id, file)),
          dispatch(pollForOutputSchema(resource.id))
        ]);
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
      });
  };
}

function createUploadSuccess(id, createdBy, createdAt, filename) {
  return {
    type: CREATE_UPLOAD_SUCCESS,
    id,
    filename,
    created_by: createdBy,
    created_at: parseDate(createdAt)
  };
}

export function uploadFile(uploadId, file) {
  return (dispatch, getState) => {
    const uploadUpdate = {
      id: uploadId
    };

    const callId = uuid();

    const call = {
      operation: UPLOAD_FILE,
      params: uploadUpdate
    };

    dispatch(apiCallStarted(callId, call));

    dispatch(addNotification('upload', callId, uploadId));

    return xhrPromise('POST', dsmapiLinks.uploadBytes(uploadId), file, uploadId, dispatch)
      .then(resp => JSON.parse(resp.responseText))
      .then(resp => {
        dispatch(uploadFileSuccess(uploadId, new Date(), resp.resource.id, resp.resource.total_rows));

        dispatch(apiCallSucceeded(callId));

        const notificationId = getState().ui.notifications.filter(
          notification => notification.callId === callId
        )[0].id;

        dispatch(removeNotificationAfterTimeout(notificationId));

        return resp;
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
      });
  };
}

function uploadFileSuccess(uploadId, finishedAt, inputSchemaId, totalRows) {
  return {
    type: UPLOAD_FILE_SUCCESS,
    uploadId,
    finishedAt,
    inputSchemaId,
    totalRows
  };
}

const SCHEMA_POLL_INTERVAL_MS = 500;

// TODO: change from polling to websocket; would look something like
// joinChannel('upload:${uploadId}', {
//   insert_input_schema: (inputSchema) => {
//     dispatch(...)
//   }
// });
function pollForOutputSchema(uploadId) {
  return (dispatch, getState) => {
    const { routing } = getState().ui;

    function pollAgain() {
      setTimeout(() => {
        dispatch(pollForOutputSchema(uploadId));
      }, SCHEMA_POLL_INTERVAL_MS);
    }

    return socrataFetch(dsmapiLinks.uploadShow(uploadId))
      .then(resp => {
        if (resp.status === 404) {
          pollAgain();

          throw new Error('Upload failed: trying again');
        } else if (resp.status === 500) {
          throw new Error('Upload failed: terminating');
        } else {
          return resp;
        }
      })
      .then(getJson)
      .then(resp => {
        const upload = resp.resource;

        if (_.get(upload, 'schemas[0].output_schemas.length') > 0) {
          const outputSchemaIds = _.chain(upload.schemas)
            .flatMap(is => is.output_schemas)
            .map(os => {
              dispatch(pollForOutputSchemaSuccess(os));
              dispatch(subscribeToOutputSchema(os));
              dispatch(subscribeToTransforms(os));
              return os.id;
            })
            .value();

          // TODO: keep this from updating total rows if it's null
          dispatch(insertInputSchema(upload));
          upload.schemas.forEach(schema => dispatch(subscribeToRowErrors(schema.id)));

          dispatch(
            push(Links.showOutputSchema(uploadId, upload.schemas[0].id, outputSchemaIds[0])(routing.location))
          );
        } else {
          pollAgain();
        }
      })
      .catch(err => {
        console.log('polling error', err);
      });
  };
}

export function pollForOutputSchemaSuccess(outputSchemaResponse) {
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
    type: POLL_FOR_OUTPUT_SCHEMA_SUCCESS,
    outputSchema,
    transforms,
    outputColumns,
    outputSchemaColumns
  };
}

export function insertInputSchema(upload) {
  return dispatch => {
    const inputSchemas = upload.schemas
      .map(inputSchema => ({
        id: inputSchema.id,
        name: inputSchema.name,
        total_rows: inputSchema.total_rows,
        upload_id: upload.id
      }))
      .reduce(
        (acc, is) => ({
          ...acc,
          [is.id]: is
        }),
        {}
      );

    const inputColumns = _.chain(upload.schemas)
      .flatMap(inputSchema => inputSchema.input_columns)
      .reduce(
        (acc, inputColumn) => ({
          ...acc,
          [inputColumn.id]: inputColumn
        }),
        {}
      )
      .value();

    dispatch({
      type: INSERT_INPUT_SCHEMA,
      inputSchemas,
      inputColumns
    });
  };
}

export function subscribeToRowErrors(inputSchemaId) {
  return dispatch => {
    const channelName = `row_errors:${inputSchemaId}`;
    dispatch(
      joinChannel(channelName, {
        errors: event => {
          dispatch(
            editInputSchema(inputSchemaId, {
              num_row_errors: event.errors
            })
          );
        }
      })
    );
  };
}

// dotProp creates entry if it doesn't exist, so don't have to create table here anymore
export function subscribeToTransforms(outputSchemaResponse) {
  return dispatch =>
    outputSchemaResponse.output_columns.forEach(oc => {
      const channelName = `transform_progress:${oc.transform.id}`;

      dispatch(
        joinChannel(channelName, {
          max_ptr: maxPtr => {
            dispatch(editTransform(oc.transform.id, { contiguous_rows_processed: maxPtr.end_row_offset }));
          },
          errors: errorsMsg => {
            dispatch(editTransform(oc.transform.id, { num_transform_errors: errorsMsg.count }));
          }
        })
      );
    });
}

function toOutputSchema(os) {
  return {
    id: os.id,
    input_schema_id: os.input_schema_id,
    error_count: os.error_count,
    created_at: os.inserted_at || os.created_at ? parseDate(os.inserted_at || os.created_at) : null,
    created_by: os.created_by
  };
}

export function subscribeToOutputSchema(outputSchema) {
  return dispatch => {
    const channelName = `output_schema:${outputSchema.id}`;

    dispatch(
      joinChannel(channelName, {
        update: updatedOutputSchema => {
          dispatch(
            editOutputSchema(outputSchema.id, {
              ...outputSchema,
              ...updatedOutputSchema
            })
          );
        }
      })
    );
  };
}
