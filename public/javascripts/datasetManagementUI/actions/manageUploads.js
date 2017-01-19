import _ from 'lodash';
import * as Links from '../links';
import * as dsmapiLinks from '../dsmapiLinks';
import {
  insertFromServer,
  insertFromServerIfNotExists,
  insertStarted,
  insertSucceeded,
  insertFailed,
  updateFromServer,
  updateStarted,
  updateSucceeded,
  updateFailed,
  updateProgress,
  createTable
} from './database';
import {
  addNotification,
  removeNotificationAfterTimeout
} from './notifications';
import { uploadNotification } from '../lib/notifications';
import { push } from 'react-router-redux';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import { parseDate } from '../lib/parseDate';


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
    dispatch(updateStarted('uploads', uploadUpdate));
    dispatch(addNotification(uploadNotification(uploadId)));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', dsmapiLinks.uploadBytes(uploadId));
    xhr.upload.onprogress = (evt) => {
      const percent = evt.loaded / evt.total * 100;
      dispatch(updateProgress('uploads', uploadUpdate, percent));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        dispatch(updateSucceeded('uploads', uploadUpdate));
        dispatch(updateFromServer('uploads', {
          id: uploadId,
          finished_at: new Date()
        }));
        dispatch(removeNotificationAfterTimeout(uploadNotification(uploadId)));
      } else {
        dispatch(updateFailed('uploads', uploadUpdate, xhr.statusText));
      }
    };
    xhr.onerror = (error) => {
      dispatch(updateFailed('uploads', uploadUpdate, error));
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
            const outputSchemaIds = subscribeToOutputColumns(dispatch, upload);
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

export function insertUploadAndSubscribeToOutput(dispatch, upload) { // => [output_schema_id]
  dispatch(insertFromServer('uploads', {
    ..._.omit(upload, ['schemas']),
    inserted_at: parseDate(upload.inserted_at),
    finished_at: upload.finished_at ? parseDate(upload.finished_at) : null
  }));
  subscribeToOutputColumns(dispatch, upload);
}

function subscribeToOutputColumns(dispatch, upload) {
  const outputSchemaIds = upload.schemas.map((inputSchema) => {
    dispatch(insertFromServer('schemas', {
      id: inputSchema.id,
      name: inputSchema.name,
      upload_id: upload.id
    }));
    inputSchema.columns.forEach((column) => {
      dispatch(insertFromServer('columns', column));
    });
    return inputSchema.output_schemas.map((outputSchema) => {
      dispatch(insertFromServer('schemas', {
        id: outputSchema.id,
        input_schema_id: inputSchema.id
      }));
      outputSchema.output_columns.forEach((outputColumn) => {
        const transform = outputColumn.transform_to;
        dispatch(insertFromServer('transforms', {
          ..._.omit(transform, ['transform_input_columns']),
          input_column_ids: transform.transform_input_columns.map((inCol) => inCol.column_id)
        }));
        dispatch(insertFromServerIfNotExists('columns', _.omit(outputColumn, ['transform_to'])));
        dispatch(insertFromServer('schema_columns', {
          schema_id: outputSchema.id,
          column_id: outputColumn.id
        }));
        dispatch(createTableAndSubscribeToTransform(transform, outputColumn));
      });
      return outputSchema.id;
    });
  });
  return _.flatten(outputSchemaIds);
}

const INITIAL_FETCH_LIMIT_ROWS = 200;

export function createTableAndSubscribeToTransform(transform, outputColumn) {
  return (dispatch) => {
    dispatch(createTable(`column_${outputColumn.id}`));
    const channelName = `transform_progress:${transform.id}`;
    const channel = window.DSMAPI_PHOENIX_SOCKET.channel(channelName, {});
    let initialRowsFetched = false;
    function updateTransformProgress(maxPtr) {
      dispatch(updateFromServer('columns', {
        id: outputColumn.id,
        contiguous_rows_processed: maxPtr.end_row_offset
      }));
      if (!initialRowsFetched) {
        initialRowsFetched = true;
        const offset = 0;
        dispatch(
          fetchAndInsertDataForColumn(transform, outputColumn, offset, INITIAL_FETCH_LIMIT_ROWS)
        );
      }
    }
    channel.on('max_ptr', _.throttle(updateTransformProgress, 1000));
    channel.on('errors', (errorsMsg) => {
      dispatch(updateFromServer('columns', {
        id: outputColumn.id,
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
  };
}

function fetchAndInsertDataForColumn(transform, outputColumn, offset, limit) {
  return (dispatch) => {
    socrataFetch(dsmapiLinks.transformResults(transform.id, limit, offset)).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        const newRecords = resp.resource.map((result, index) => ({
          index,
          ...result
        }));
        dispatch(insertFromServer(`column_${outputColumn.id}`, newRecords));
        // TODO: could just use `db.column_${column_id}.length` instead of this
        const updateFetchedRows = updateFromServer('columns', {
          id: outputColumn.id,
          fetched_rows: offset + limit
        });
        dispatch(updateFetchedRows);
      }).
      catch((error) => {
        console.error('failed to get transform results', error);
      });
  };
}
