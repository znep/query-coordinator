import _ from 'lodash';
import * as Links from '../links';
import * as dsmapiLinks from '../dsmapiLinks';
import {
  upsertFromServer,
  upsertStarted,
  upsertSucceeded,
  upsertFailed,
  updateFromServer,
  updateStarted,
  updateSucceeded,
  updateFailed,
  updateProgress,
  createTable,
  batch
} from './database';
import {
  addNotification,
  removeNotificationAfterTimeout
} from './notifications';
import { uploadNotification } from '../lib/notifications';
import { push } from 'react-router-redux';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import { parseDate } from '../lib/parseDate';
import { joinChannel } from './channels';

export function createUpload(file) {
  return (dispatch, getState) => {
    const { routing } = getState();
    const uploadInsert = {
      filename: file.name
    };
    dispatch(upsertStarted('uploads', uploadInsert));
    return socrataFetch(dsmapiLinks.uploadCreate, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name
      })
    }).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        const newUpload = resp.resource;
        dispatch(upsertSucceeded('uploads', uploadInsert, {
          id: newUpload.id,
          created_by: newUpload.created_by
        }));
        dispatch(push(Links.showUpload(newUpload.id)(routing.location)));
        return Promise.all([
          dispatch(uploadFile(newUpload.id, file)),
          dispatch(pollForOutputSchema(newUpload.id))
        ]);
      }).
      catch((err) => {
        return dispatch(upsertFailed('uploads', uploadInsert, err));
      });
  };
}

// TODO: promisify this? would make testing easier, and would match the rest of the
// async calls that use fetch
function xhrPromise(method, url, file, uploadUpdate, dispatch) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

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
        rej(xhr);
      }
    };

    xhr.onerror = () => {
      console.log('failed')
      rej(xhr)
    };

    xhr.setRequestHeader('Content-type', file.type);

    xhr.send();
  })
}

export function uploadFile(uploadId, file) {
  return (dispatch) => {
    const uploadUpdate = {
      id: uploadId
    };
    let percent;
    dispatch(updateStarted('uploads', uploadUpdate));
    dispatch(addNotification(uploadNotification(uploadId)));
    return xhrPromise('POST', dsmapiLinks.uploadBytes(uploadId), file, uploadUpdate, dispatch)
      .then(resp => JSON.parse(resp.responseText))
      .then(resp => {
        dispatch(updateSucceeded('uploads', uploadUpdate));
        dispatch(updateFromServer('uploads', {
          id: uploadId,
          finished_at: new Date()
        }));
        dispatch(removeNotificationAfterTimeout(uploadNotification(uploadId)));
      })
      .catch(resp => {
        dispatch(updateFailed('uploads', uploadUpdate, xhr.status, percent));
      });
    // const xhr = new XMLHttpRequest();
    // xhr.open('POST', dsmapiLinks.uploadBytes(uploadId));
    // if (xhr.upload) {
    //   xhr.upload.onprogress = (evt) => {
    //     percent = evt.loaded / evt.total * 100;
    //     dispatch(updateProgress('uploads', uploadUpdate, percent));
    //   };
    // }
    // xhr.onload = () => {
    //   if (xhr.status === 200) {
    //     const { resource: inputSchema } = JSON.parse(xhr.responseText);
    //     dispatch(updateSucceeded('uploads', uploadUpdate));
    //     dispatch(updateFromServer('uploads', {
    //       id: uploadId,
    //       finished_at: new Date()
    //     }));
    //     setTimeout(() => {
    //       dispatch(updateFromServer('input_schemas', {
    //         id: inputSchema.id,
    //         total_rows: inputSchema.total_rows
    //       }));
    //     }, 500); // remove when EN-13948 is fixed
    //     dispatch(removeNotificationAfterTimeout(uploadNotification(uploadId)));
    //   } else {
    //     dispatch(updateFailed('uploads', uploadUpdate, xhr.status, percent));
    //   }
    // };
    // xhr.onerror = () => {
    //   dispatch(updateFailed('uploads', uploadUpdate, xhr.status, percent));
    // };
    // xhr.setRequestHeader('Content-type', file.type);
    // xhr.send();
  };
}

const SCHEMA_POLL_INTERVAL_MS = 500;

function pollForOutputSchema(uploadId) {
  return (dispatch, getState) => {
    const { routing } = getState();
    function pollAgain() {
      setTimeout(() => {
        dispatch(pollForOutputSchema(uploadId));
      }, SCHEMA_POLL_INTERVAL_MS);
    }

    return socrataFetch(dsmapiLinks.uploadShow(uploadId)).
      then(getJson).
      then((resp) => {
        // TODO: parsing the response as json just returns the parsed body of the
        // resonse, so the status is never goin to be defined here. Should re-write
        // this to account for that
        if (resp.status === 404) {
          pollAgain();
        } else if (resp.status === 500) {
          dispatch(updateFailed('uploads', { id: uploadId }));
        } else {
          const upload = resp.resource;
          if (_.get(upload, 'schemas[0].output_schemas.length') > 0) {
            // TODO: subscribeToUpload not a thunk :(. Bad for testing, bad for debugging
            // bad for establishing a standard interface for communicating with store. Convert
            const outputSchemaIds = subscribeToUpload(dispatch, upload);
            dispatch(push(Links.showOutputSchema(
              uploadId,
              upload.schemas[0].id,
              outputSchemaIds[0]
            )(routing.location)));
          } else {
            pollAgain();
          }
        }
      })
      .catch(err => err);
  };
}

export function insertAndSubscribeToUpload(dispatch, upload) {
  dispatch(upsertFromServer('uploads', {
    ..._.omit(upload, ['schemas']),
    inserted_at: parseDate(upload.inserted_at),
    finished_at: upload.finished_at ? parseDate(upload.finished_at) : null,
    failed_at: upload.failed_at ? parseDate(upload.failed_at) : null,
    created_by: upload.created_by
  }));

  if (upload.failed_at) {
    dispatch(addNotification(uploadNotification(upload.id)));
  } else {
    subscribeToUpload(dispatch, upload);
  }
}

function subscribeToUpload(dispatch, upload) {
  const outputSchemaIds = upload.schemas.map((inputSchema) => {
    dispatch(upsertFromServer('input_schemas', {
      id: inputSchema.id,
      name: inputSchema.name,
      total_rows: inputSchema.total_rows,
      upload_id: upload.id
    }));
    dispatch(subscribeToRowErrors(inputSchema.id));
    dispatch(batch(inputSchema.input_columns.map((column) => {
      upsertFromServer('input_columns', column)
    }
    )));
    return inputSchema.output_schemas.map((outputSchema) => {
      return insertAndSubscribeToOutputSchema(dispatch, outputSchema);
    });
  });
  return _.flatten(outputSchemaIds);
}

function subscribeToRowErrors(inputSchemaId) {
  return (dispatch) => {
    const channelName = `row_errors:${inputSchemaId}`;
    dispatch(joinChannel(channelName, {
      errors: (event) => {
        dispatch(updateFromServer('input_schemas', {
          id: inputSchemaId,
          num_row_errors: event.errors
        }));
      }
    }));
  };
}

function insertAndSubscribeToOutputSchema(dispatch, outputSchemaResponse) {
  dispatch(upsertFromServer('output_schemas', toOutputSchema(outputSchemaResponse)));
  insertChildrenAndSubscribeToOutputSchema(dispatch, outputSchemaResponse);
  return outputSchemaResponse.id;
}

export function insertChildrenAndSubscribeToOutputSchema(dispatch, outputSchemaResponse) {
  dispatch(subscribeToOutputSchema(outputSchemaResponse));
  const actions = [];
  outputSchemaResponse.output_columns.forEach((outputColumn) => {
    const transform = outputColumn.transform;
    actions.push(upsertFromServer('transforms', transform));

    actions.push(upsertFromServer('output_columns', {
      ..._.omit(outputColumn, ['transform']),
      transform_id: outputColumn.transform.id
    }));
    actions.push(upsertFromServer('output_schema_columns', {
      id: `${outputSchemaResponse.id}-${outputColumn.id}`,
      output_schema_id: outputSchemaResponse.id,
      output_column_id: outputColumn.id,
      is_primary_key: outputColumn.is_primary_key
    }));
  });
  outputSchemaResponse.output_columns.forEach((outputColumn) => {
    dispatch(createTableAndSubscribeToTransform(outputColumn.transform));
  });
  dispatch(batch(actions));
}

function createTableAndSubscribeToTransform(transform) {
  return (dispatch, getState) => {
    const db = getState().db;
    // maybe create table
    const tableName = `transform_${transform.id}`;
    if (!db[tableName]) {
      dispatch(createTable(tableName));
    }
    // maybe subscribe to transform
    if (transform.completed_at && transform.contiguous_rows_processed) {
      // do nothing
    } else if (transform.completed_at) {
      const inputColumnId = transform.transform_input_columns[0].input_column_id;
      const inputColumn = db.input_columns[inputColumnId];
      const inputSchema = db.input_schemas[inputColumn.input_schema_id];
      dispatch(updateFromServer('transforms', {
        id: transform.id,
        contiguous_rows_processed: inputSchema.total_rows
      }));
    } else {
      const channelName = `transform_progress:${transform.id}`;
      dispatch(joinChannel(channelName, {
        max_ptr: (maxPtr) => {
          dispatch(updateFromServer('transforms', {
            id: transform.id,
            contiguous_rows_processed: maxPtr.end_row_offset
          }));
        },
        errors: (errorsMsg) => {
          dispatch(updateFromServer('transforms', {
            id: transform.id,
            num_transform_errors: errorsMsg.count
          }));
        }
      }));
    }
  };
}

function toOutputSchema(os) {
  return {
    id: os.id,
    input_schema_id: os.input_schema_id,
    error_count: os.error_count,
    inserted_at: os.inserted_at ? parseDate(os.inserted_at) : null,
    created_by: os.created_by
  };
}

function subscribeToOutputSchema(outputSchema) {
  return (dispatch) => {
    const channelName = `output_schema:${outputSchema.id}`;
    dispatch(joinChannel(channelName, {
      update: (updatedOutputSchema) => {
        dispatch(updateFromServer('output_schemas', toOutputSchema({
          ...outputSchema,
          ...updatedOutputSchema
        })));
      }
    }));
  };
}
