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
  createTable,
  batch
} from './database';
import { push } from 'react-router-redux';
import { socrataFetch, checkStatus, getJson } from '../lib/http';

export function createUpload(file) {
  return (dispatch, getState) => {
    const routing = getState().routing;
    const uploadInsert = {
      filename: file.name
    };
    dispatch(insertStarted('uploads', uploadInsert));
    socrataFetch(dsmapiLinks.uploadCreate(routing), {
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
  return (dispatch, getState) => {
    const routing = getState().routing;
    const uploadUpdate = {
      id: uploadId
    };
    dispatch(updateStarted('uploads', uploadUpdate));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', dsmapiLinks.uploadBytes(routing, uploadId));
    xhr.upload.onprogress = (evt) => {
      const percent = evt.loaded / evt.total * 100;
      dispatch(updateProgress('uploads', uploadUpdate, percent));
    };
    xhr.onload = () => {
      dispatch(updateSucceeded('uploads', uploadUpdate));
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

    socrataFetch(dsmapiLinks.uploadShow(routing, uploadId)).
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
    inserted_at: new Date(`${upload.inserted_at}Z`)
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
    const initialFetchFor = [];
    channel.on('max_ptr', (maxPtr) => {
      dispatch(updateFromServer('columns', {
        id: outputColumn.id,
        contiguous_rows_processed: maxPtr.end_row_offset
      }));
      if (!initialFetchFor.includes(outputColumn.id)) {
        initialFetchFor.push(outputColumn.id);
        const offset = 0;
        dispatch(
          fetchAndInsertDataForColumn(transform, outputColumn, offset, INITIAL_FETCH_LIMIT_ROWS)
        );
      }
    });
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
  return (dispatch, getState) => {
    const routing = getState().routing;
    socrataFetch(dsmapiLinks.transformResults(routing, transform.id, limit, offset)).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        const operations = resp.resource.map((value, idx) => (
          insertFromServer(`column_${outputColumn.id}`, {
            id: idx,
            value: value
          })
        ));
        const updateFetchedRows = updateFromServer('columns', {
          id: outputColumn.id,
          fetched_rows: offset + limit
        });
        dispatch(batch([...operations, updateFetchedRows]));
      }).
      catch((error) => {
        console.error('failed to get transform results', error);
      });
  };
}
