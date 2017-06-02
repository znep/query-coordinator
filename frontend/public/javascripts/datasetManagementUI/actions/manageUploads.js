import _ from 'lodash';
import * as Links from '../links';
import * as dsmapiLinks from '../dsmapiLinks';
import { upsertFromServer, updateProgress } from './database';
import { addNotification, removeNotificationAfterTimeout } from './notifications';
import { uploadNotification } from '../lib/notifications';
import { push } from 'react-router-redux';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import { parseDate } from '../lib/parseDate';
import { joinChannel } from './channels';
import uuid from 'uuid';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'actions/apiCalls';

function xhrPromise(method, url, file, uploadUpdate, dispatch) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    let percent;

    if (xhr.upload) {
      xhr.upload.onprogress = evt => {
        percent = evt.loaded / evt.total * 100;
        dispatch(updateProgress('uploads', uploadUpdate, percent));
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

// convention should be:
// verbNoun for async action creators
// verbNounSuccess and/or verbNounFailure for non-async action creators that update store based on api response
// verbNoun for ui aciton creators
export function createUpload(file) {
  return (dispatch, getState) => {
    const { ui } = getState();

    const callId = uuid();

    const call = {
      operation: 'CREATE_UPLOAD',
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
        console.log('err', err);
        dispatch(apiCallFailed(callId, err));
      });
  };
}

function createUploadSuccess(id, createdBy, createdAt, filename) {
  return {
    type: 'CREATE_UPLOAD_SUCCESS',
    id,
    filename,
    created_by: createdBy,
    created_at: createdAt
  };
}

export function uploadFile(uploadId, file) {
  return dispatch => {
    const uploadUpdate = {
      id: uploadId
    };

    const callId = uuid();

    const call = {
      operation: 'UPLOAD_FILE',
      params: uploadUpdate
    };

    dispatch(apiCallStarted(callId, call));

    // dispatch(addNotification(uploadNotification(uploadId)));

    return xhrPromise('POST', dsmapiLinks.uploadBytes(uploadId), file, uploadUpdate, dispatch)
      .then(resp => JSON.parse(resp.responseText))
      .then(resp => {
        dispatch(uploadFileSuccess(uploadId, new Date(), resp.resource.id, resp.resource.total_rows));

        // dispatch(removeNotificationAfterTimeout(uploadNotification(uploadId)));

        return resp;
      })
      .catch(err => {
        console.log('error here', err);
        dispatch(apiCallFailed(callId, err));
      });
  };
}

function uploadFileSuccess(uploadId, finishedAt, inputSchemaId, totalRows) {
  return {
    type: 'UPLOAD_FILE_SUCCESS',
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
          dispatch(subscribeToUpload(upload));

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

function pollForOutputSchemaSuccess(outputSchemaResponse) {
  const outputSchema = toOutputSchema(outputSchemaResponse);

  const transforms = outputSchemaResponse.output_columns.reduce((acc, oc) => {
    return {
      ...acc,
      [oc.transform.id]: oc.transform
    };
  }, {});

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
    type: 'POLL_FOR_OUTPUT_SCHEMA_SUCCESS',
    outputSchema,
    transforms,
    outputColumns,
    outputSchemaColumns
  };
}

export function insertAndSubscribeToUpload(dispatch, upload) {
  dispatch(
    upsertFromServer('uploads', {
      ..._.omit(upload, ['schemas']),
      created_at: parseDate(upload.inserted_at || upload.created_at),
      finished_at: upload.finished_at ? parseDate(upload.finished_at) : null,
      failed_at: upload.failed_at ? parseDate(upload.failed_at) : null,
      created_by: upload.created_by
    })
  );

  if (upload.failed_at) {
    dispatch(addNotification(uploadNotification(upload.id)));
  } else {
    dispatch(subscribeToUpload(upload));
  }
}

function addInputColumn(column) {
  return {
    type: 'ADD_INPUT_COLUMN',
    id: column.id,
    column
  };
}

function subscribeToUpload(upload) {
  return dispatch =>
    upload.schemas.forEach(inputSchema => {
      dispatch(
        editInputSchema(inputSchema.id, {
          id: inputSchema.id,
          name: inputSchema.name,
          total_rows: inputSchema.total_rows,
          upload_id: upload.id
        })
      );

      dispatch(subscribeToRowErrors(inputSchema.id));

      // TODO: not so sure this is the best place to do this
      inputSchema.input_columns.forEach(column => dispatch(addInputColumn(column)));
    });
}

function editInputSchema(id, payload) {
  return {
    type: 'EDIT_INPUT_SCHEMA',
    id,
    payload
  };
}

function subscribeToRowErrors(inputSchemaId) {
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
function subscribeToTransforms(outputSchemaResponse) {
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

// function createTableAndSubscribeToTransform(transform) {
//   return (dispatch, getState) => {
//     // const { entities } = getState();
//
//     // const tableName = `transform_${transform.id}`;
//
//     // dotProp creates entry if it doesn't exist, so can just handle this in reudcer
//     // if (!entities[tableName]) {
//     //   dispatch(createTable(tableName));
//     // }
//     const channelName = `transform_progress:${transform.id}`;
//
//     dispatch(
//       joinChannel(channelName, {
//         max_ptr: maxPtr => {
//           dispatch(editTransform(transform.id, { contiguous_rows_processed: maxPtr.end_row_offset }));
//         },
//         errors: errorsMsg => {
//           dispatch(editTransform(transform.id, { num_transform_errors: errorsMsg.count }));
//         }
//       })
//     );
//   };
// }

function editTransform(id, payload) {
  return {
    type: 'EDIT_TRANSFORM',
    id,
    payload
  };
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

function subscribeToOutputSchema(outputSchema) {
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

function editOutputSchema(id, payload) {
  return {
    type: 'EDIT_OUTPUT_SCHEMA',
    id,
    payload
  };
}
