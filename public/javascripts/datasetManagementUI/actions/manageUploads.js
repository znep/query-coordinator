import _ from 'lodash';
import * as Links from '../links';
import * as dsmapiLinks from '../dsmapiLinks';
import {
  insertFromServer,
  insertMultipleFromServer,
  insertFromServerIfNotExists,
  insertStarted,
  insertSucceeded,
  insertFailed,
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
import { loadRowErrors } from './showOutputSchema';

export function createUpload(file) {
  return (dispatch, getState) => {
    const routing = getState().routing;
    const uploadInsert = {
      filename: file.name
    };
    dispatch(insertStarted('uploads', uploadInsert));
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
        dispatch(insertSucceeded('uploads', uploadInsert, { id: newUpload.id }));
        dispatch(push(Links.showUpload(newUpload.id)(routing)));
        dispatch(uploadFile(newUpload.id, file));
        dispatch(pollForOutputSchema(newUpload.id));
      }).
      catch((err) => {
        dispatch(insertFailed('uploads', uploadInsert, err));
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
        dispatch(updateFromServer('uploads', {
          id: uploadId,
          finished_at: new Date()
        }));
        dispatch(updateFromServer('input_schemas', {
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
    const routing = getState().routing;
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
            )(routing)));
          } else {
            pollAgain();
          }
        }
      });
  };
}

export function insertAndSubscribeToUpload(dispatch, upload) {
  dispatch(insertFromServer('uploads', {
    ..._.omit(upload, ['schemas']),
    inserted_at: parseDate(upload.inserted_at),
    finished_at: upload.finished_at ? parseDate(upload.finished_at) : null,
    created_by: upload.created_by
  }));
  subscribeToUpload(dispatch, upload);
}

function subscribeToUpload(dispatch, upload) {
  const outputSchemaIds = upload.schemas.map((inputSchema) => {
    dispatch(insertFromServerIfNotExists('input_schemas', {
      id: inputSchema.id,
      name: inputSchema.name,
      total_rows: inputSchema.total_rows,
      upload_id: upload.id
    }));
    // TODO: factor channel joining out into a function
    const channelName = `row_errors:${inputSchema.id}`;
    const channel = window.DSMAPI_PHOENIX_SOCKET.channel(channelName);
    let rowErrorsSoFar = 0;
    channel.on('errors', (event) => {
      dispatch(updateFromServer('input_schemas', {
        id: inputSchema.id,
        num_row_errors: event.errors
      }));
      dispatch(loadRowErrors(inputSchema.id, rowErrorsSoFar, 100));
      rowErrorsSoFar = event.errors;
    });
    channel.join().
      receive('ok', (response) => {
        console.log(`successfully joined ${channelName}:`, response);
      }).
      receive('error', (error) => {
        console.log(`failed to join ${channelName}:`, error);
      });
    inputSchema.input_columns.forEach((column) => {
      dispatch(insertFromServer('input_columns', column));
    });
    return inputSchema.output_schemas.map((outputSchema) => {
      return insertAndSubscribeToOutputSchema(dispatch, outputSchema);
    });
  });
  return _.flatten(outputSchemaIds);
}

function insertAndSubscribeToOutputSchema(dispatch, outputSchemaResponse) {
  dispatch(insertFromServer('output_schemas', toOutputSchema(outputSchemaResponse)));
  insertChildrenAndSubscribeToOutputSchema(dispatch, outputSchemaResponse);
  return outputSchemaResponse.id;
}

export function insertChildrenAndSubscribeToOutputSchema(dispatch, outputSchemaResponse) {
  dispatch(subscribeToOutputSchema(outputSchemaResponse));
  const actions = [];
  outputSchemaResponse.output_columns.forEach((outputColumn) => {
    const transform = outputColumn.transform;
    actions.push(insertFromServerIfNotExists('transforms', transform));
    actions.push(insertFromServerIfNotExists('output_columns', {
      ..._.omit(outputColumn, ['transform']),
      transform_id: outputColumn.transform.id
    }));
    dispatch(insertFromServerIfNotExists('output_schema_columns', {
      id: `${outputSchemaResponse.id}-${outputColumn.id}`,
      output_schema_id: outputSchemaResponse.id,
      output_column_id: outputColumn.id
    }));
  });
  dispatch(batch(actions));
  outputSchemaResponse.output_columns.forEach((outputColumn) => {
    dispatch(createTableAndSubscribeToTransform(outputColumn.transform));
  });
}

const INITIAL_FETCH_LIMIT_ROWS = 200;

export function createTableAndSubscribeToTransform(transform) {
  return (dispatch, getState) => {
    const db = getState().db;
    const transformInDb = db.transforms[transform.id];
    if (!transformInDb.row_fetch_started) {
      dispatch(updateFromServer('transforms', {
        id: transform.id,
        row_fetch_started: true
      }));
      dispatch(createTable(`transform_${transform.id}`));
      const channelName = `transform_progress:${transform.id}`;
      const channel = window.DSMAPI_PHOENIX_SOCKET.channel(channelName, {});
      let initialRowsFetched = false;
      channel.on('max_ptr', (maxPtr) => {
        dispatch(updateFromServer('transforms', {
          id: transform.id,
          contiguous_rows_processed: maxPtr.end_row_offset
        }));
        if (!initialRowsFetched) {
          initialRowsFetched = true;
          const offset = 0;
          dispatch(
            fetchAndInsertDataForTransform(transform, offset, INITIAL_FETCH_LIMIT_ROWS)
          );
        }
      });
      channel.on('errors', (errorsMsg) => {
        dispatch(updateFromServer('transforms', {
          id: transform.id,
          num_transform_errors: errorsMsg.count
        }));
      });
      channel.join().
        receive('ok', (response) => {
          console.log(`successfully joined ${channelName}:`, response);
        }).
        receive('error', (error) => {
          console.log(`failed to join ${channelName}:`, error);
        });
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
    const channel = window.DSMAPI_PHOENIX_SOCKET.channel(channelName, {});
    channel.on('update', (updatedOutputSchema) => {
      dispatch(updateFromServer('output_schemas', toOutputSchema({
        ...outputSchema,
        ...updatedOutputSchema
      })));
    });

    channel.join().
      receive('ok', () => console.log(`Joined ${channelName}`)).
      receive('error', () => console.error(`Failed to join ${channelName}`));
  };
}

function fetchAndInsertDataForTransform(transform, offset, limit) {
  return (dispatch) => {
    socrataFetch(dsmapiLinks.transformResults(transform.id, limit, offset)).
      then(checkStatus).
      then(getJson).
      catch((error) => {
        console.error('failed to get transform results', error);
      }).
      then((resp) => {
        const recordsWithIndex = resp.resource.map((result, id) => ({
          id,
          ...result
        }));
        const keyedById = _.keyBy(recordsWithIndex, 'id');
        dispatch(insertMultipleFromServer(`transform_${transform.id}`, keyedById));
        dispatch(updateFromServer('transforms', {
          id: transform.id,
          fetched_rows: offset + limit
        }));
      });
  };
}
