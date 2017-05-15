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
    socrataFetch(dsmapiLinks.uploadCreate, {
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
        dispatch(uploadFile(newUpload.id, file));
        dispatch(pollForOutputSchema(newUpload.id));
      }).
      catch((err) => {
        dispatch(upsertFailed('uploads', uploadInsert, err));
      });
  };
}

export function uploadFile(uploadId, file) {
  return (dispatch) => {
    const uploadUpdate = {
      id: uploadId
    };
    let percent;
    dispatch(updateStarted('uploads', uploadUpdate));
    dispatch(addNotification(uploadNotification(uploadId)));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', dsmapiLinks.uploadBytes(uploadId));
    xhr.upload.onprogress = (evt) => {
      percent = evt.loaded / evt.total * 100;
      dispatch(updateProgress('uploads', uploadUpdate, percent));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const { resource: inputSchema } = JSON.parse(xhr.responseText);
        dispatch(updateSucceeded('uploads', uploadUpdate));
        // these writes to uploads and input_schemas usually happen before polling succeeds
        // but can also happen after in the case of a very small dataset
        dispatch(upsertFromServer('uploads', {
          id: uploadId,
          finished_at: new Date()
        }));
        dispatch(upsertFromServer('input_schemas', {
          id: inputSchema.id,
          total_rows: inputSchema.total_rows
        }));
        dispatch(removeNotificationAfterTimeout(uploadNotification(uploadId)));
      } else {
        dispatch(updateFailed('uploads', uploadUpdate, xhr.status, percent));
      }
    };
    xhr.onerror = () => {
      dispatch(updateFailed('uploads', uploadUpdate, xhr.status, percent));
    };
    xhr.setRequestHeader('Content-type', file.type);
    xhr.send(file);
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

    socrataFetch(dsmapiLinks.uploadShow(uploadId)).
      then(getJson).
      then((resp) => {
        if (resp.status === 404) {
          pollAgain();
        } else if (resp.status === 500) {
          dispatch(updateFailed('uploads', { id: uploadId }));
        } else {
          const upload = resp.resource;
          if (_.get(upload, 'schemas[0].output_schemas.length') > 0) {
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
      });
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
    dispatch(batch(inputSchema.input_columns.map((column) => (
      upsertFromServer('input_columns', column)
    ))));
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
