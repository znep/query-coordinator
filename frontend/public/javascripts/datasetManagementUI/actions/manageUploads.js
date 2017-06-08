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
import { addNotification, removeNotificationAfterTimeout } from './notifications';
import { uploadNotification } from '../lib/notifications';
import { push } from 'react-router-redux';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import { parseDate } from '../lib/parseDate';
import { joinChannel } from './channels';

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

export const uploadFile = (uploadId, file) => dispatch => {
  const uploadUpdate = {
    id: uploadId
  };

  dispatch(updateStarted('uploads', uploadUpdate));

  dispatch(addNotification(uploadNotification(uploadId)));

  return xhrPromise('POST', dsmapiLinks.uploadBytes(uploadId), file, uploadUpdate, dispatch)
    .then(resp => JSON.parse(resp.responseText))
    .then(resp => {
      dispatch(updateSucceeded('uploads', uploadUpdate));

      dispatch(
        updateFromServer('uploads', {
          id: uploadId,
          finished_at: new Date()
        })
      );

      dispatch(
        updateFromServer('input_schemas', {
          id: resp.resource.id,
          total_rows: resp.resource.total_rows
        })
      );

      dispatch(removeNotificationAfterTimeout(uploadNotification(uploadId)));

      return resp;
    })
    .catch(err => dispatch(updateFailed('uploads', uploadUpdate, err.xhr.status, err.percent)));
};

const SCHEMA_POLL_INTERVAL_MS = 500;

// TODO: change from polling to websocket; would look something like
// joinChannel('upload:${uploadId}', {
//   insert_input_schema: (inputSchema) => {
//     dispatch(...)
//   }
// });
const pollForOutputSchema = uploadId => (dispatch, getState) => {
  const { routing } = getState();

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
        dispatch(updateFailed('uploads', { id: uploadId }));

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
            dispatch(insertChildrenAndSubscribeToOutputSchema(os));
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
    .catch(err => err);
};

export const createUpload = file => (dispatch, getState) => {
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
  })
    .then(checkStatus)
    .then(getJson)
    .then(resp => {
      const newUpload = resp.resource;

      dispatch(
        upsertSucceeded('uploads', uploadInsert, {
          id: newUpload.id,
          created_by: newUpload.created_by,
          created_at: parseDate(newUpload.inserted_at || newUpload.created_at)
        })
      );

      dispatch(push(Links.showUpload(newUpload.id)(routing.location)));

      return Promise.all([
        dispatch(uploadFile(newUpload.id, file)),
        dispatch(pollForOutputSchema(newUpload.id))
      ]);
    })
    .catch(err => dispatch(upsertFailed('uploads', uploadInsert, err)));
};

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

function subscribeToUpload(upload) {
  return dispatch =>
    upload.schemas.forEach(inputSchema => {
      dispatch(
        upsertFromServer('input_schemas', {
          id: inputSchema.id,
          name: inputSchema.name,
          total_rows: inputSchema.total_rows,
          upload_id: upload.id
        })
      );

      dispatch(subscribeToRowErrors(inputSchema.id));

      dispatch(batch(inputSchema.input_columns.map(column => upsertFromServer('input_columns', column))));
    });
}

function subscribeToRowErrors(inputSchemaId) {
  return dispatch => {
    const channelName = `row_errors:${inputSchemaId}`;
    dispatch(
      joinChannel(channelName, {
        errors: event => {
          dispatch(
            updateFromServer('input_schemas', {
              id: inputSchemaId,
              num_row_errors: event.errors
            })
          );
        }
      })
    );
  };
}

export function insertChildrenAndSubscribeToOutputSchema(outputSchemaResponse) {
  return dispatch => {
    dispatch(upsertFromServer('output_schemas', toOutputSchema(outputSchemaResponse)));

    dispatch(subscribeToOutputSchema(outputSchemaResponse));

    const actions = [];

    outputSchemaResponse.output_columns.forEach(outputColumn => {
      const transform = outputColumn.transform;

      actions.push(upsertFromServer('transforms', {
        ...transform,
        error_indices: []
      }));

      actions.push(
        upsertFromServer('output_columns', {
          ..._.omit(outputColumn, ['transform']),
          transform_id: outputColumn.transform.id
        })
      );

      actions.push(
        upsertFromServer('output_schema_columns', {
          id: `${outputSchemaResponse.id}-${outputColumn.id}`,
          output_schema_id: outputSchemaResponse.id,
          output_column_id: outputColumn.id,
          is_primary_key: outputColumn.is_primary_key
        })
      );
    });

    outputSchemaResponse.output_columns.forEach(outputColumn => {
      dispatch(createTableAndSubscribeToTransform(outputColumn.transform));
    });

    dispatch(batch(actions));
  };
}

function createTableAndSubscribeToTransform(transform) {
  return (dispatch, getState) => {
    const db = getState().db;
    // maybe create table
    const tableName = `transform_${transform.id}`;
    if (!db[tableName]) {
      dispatch(createTable(tableName));
    }
    const channelName = `transform_progress:${transform.id}`;
    dispatch(
      joinChannel(channelName, {
        max_ptr: maxPtr => {
          dispatch(
            updateFromServer('transforms', {
              id: transform.id,
              contiguous_rows_processed: maxPtr.end_row_offset
            })
          );
        },
        errors: errorsMsg => {
          dispatch(
            updateFromServer('transforms', {
              id: transform.id,
              num_transform_errors: errorsMsg.count
            })
          );
        }
      })
    );
  };
}

function toOutputSchema(os) {
  return {
    id: os.id,
    input_schema_id: os.input_schema_id,
    error_count: os.error_count,
    created_at: (os.inserted_at || os.created_at) ? parseDate(os.inserted_at || os.created_at) : null,
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
            updateFromServer(
              'output_schemas',
              toOutputSchema({
                ...outputSchema,
                ...updatedOutputSchema
              })
            )
          );
        }
      })
    );
  };
}
