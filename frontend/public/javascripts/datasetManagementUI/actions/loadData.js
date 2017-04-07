import _ from 'lodash';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import {
  batch,
  insertMultipleFromServer,
  loadStarted,
  loadSucceeded,
  loadFailed,
  updateFromServer
} from '../actions/database';
import * as DisplayState from '../lib/displayState';
import * as Selectors from '../selectors';
import * as dsmapiLinks from '../dsmapiLinks';

export const PAGE_SIZE = 50;

// TODO: refactor: the URL is the load plan, duh
export function getLoadPlan(db, outputSchemaId, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS: {
      const { upload, inputSchema } = Selectors.pathForOutputSchema(db, outputSchemaId);
      const columnId = _.find(db.output_columns, { transform_id: displayState.transformId }).id;
      const url = dsmapiLinks.columnErrors(
        upload.id, inputSchema.id, outputSchemaId, columnId, PAGE_SIZE, (displayState.pageNo - 1) * PAGE_SIZE
      );

      const alreadyLoaded = _.find(db.__loads__, { url });
      if (!alreadyLoaded) {
        return {
          type: 'COLUMN_ERRORS',
          transformId: displayState.transformId,
          outputSchemaId,
          pageNo: displayState.pageNo
        };
      } else {
        return null;
      }
    }
    case DisplayState.ROW_ERRORS: {
      // kind of seems easier to only formulate the url once...
      // do a "here's the url, fetch it if we haven't already fetched it" kind of thing
      const { upload, inputSchema } = Selectors.pathForOutputSchema(db, outputSchemaId);
      const url = dsmapiLinks.rowErrors(
        upload.id, inputSchema.id, PAGE_SIZE, (displayState.pageNo - 1) * PAGE_SIZE
      );
      const alreadyLoaded = _.find(db.__loads__, { url });
      if (!alreadyLoaded) {
        return {
          type: 'ROW_ERRORS',
          inputSchemaId: inputSchema.id,
          pageNo: displayState.pageNo
        };
      } else {
        return null;
      }
    }
    case DisplayState.NORMAL: {
      const { inputSchema } = Selectors.pathForOutputSchema(db, outputSchemaId);
      const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);
      const minRowsProcessed = Selectors.rowsTransformed(columns);
      const firstRowNeeded = (displayState.pageNo - 1) * PAGE_SIZE;
      const lastRowNeeded = firstRowNeeded + PAGE_SIZE;
      const alreadyLoaded = _.find(db.__loads__, {
        url: urlForNormalPreview(db, outputSchemaId, displayState.pageNo)
      });

      const haveWholePage = minRowsProcessed >= lastRowNeeded;
      const doneLoadingThisPage = minRowsProcessed === inputSchema.total_rows &&
                                  minRowsProcessed >= firstRowNeeded;

      if ((haveWholePage || doneLoadingThisPage) && !alreadyLoaded) {
        return {
          type: 'NORMAL',
          outputSchemaId,
          pageNo: displayState.pageNo
        };
      } else {
        return null;
      }
    }
    default:
      console.error('unknown display state', displayState.type);
      return null;
  }
}

export function loadVisibleData(outputSchemaId, displayState) {
  return (dispatch, getState) => {
    const loadPlan = getLoadPlan(getState().db, outputSchemaId, displayState);
    if (loadPlan) {
      dispatch(executeLoadPlan(loadPlan));
    }
  };
}

function executeLoadPlan(loadPlan) {
  return (dispatch) => {
    switch (loadPlan.type) {
      case 'NORMAL':
        dispatch(loadNormalPreview(loadPlan.outputSchemaId, loadPlan.pageNo));
        break;
      case 'ROW_ERRORS':
        dispatch(loadRowErrors(loadPlan.inputSchemaId, loadPlan.pageNo));
        break;
      case 'COLUMN_ERRORS':
        dispatch(loadColumnErrors(loadPlan.transformId, loadPlan.outputSchemaId, loadPlan.pageNo));
        break;
      default:
        console.error('unknown load plan type', loadPlan.type);
    }
  };
}

// TODO: move to dsmapiLinks?
function urlForNormalPreview(db, outputSchemaId, pageNo) {
  const { upload, inputSchema } = Selectors.pathForOutputSchema(db, outputSchemaId);

  return dsmapiLinks.rows(
    upload.id, inputSchema.id, outputSchemaId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE
  );
}

export function loadNormalPreview(outputSchemaId, pageNo) {
  return (dispatch, getState) => {
    const db = getState().db;
    const url = urlForNormalPreview(db, outputSchemaId, pageNo);
    dispatch(loadStarted(url));
    socrataFetch(url).
      then(checkStatus).
      then(getJson).
      catch((error) => {
        console.error('failed to get transform results', error);
        dispatch(loadFailed(url, error));
      }).
      then((resp) => {
        dispatch(loadSucceeded(url));
        const transformIds = resp[0].output_columns.map((col) => col.transform.id);
        const withoutHeader = resp.slice(1);
        dispatch(batch(_.flatten(transformIds.map((transformId, colIdx) => {
          // transpose row-oriented response to columnar data structure
          const rowsForColumn = withoutHeader.
            filter((row) => row.row).
            map((row) => ({
              id: row.offset,
              ...row.row[colIdx]
            }));
          const actions = [];
          actions.push(insertMultipleFromServer(
            `transform_${transformId}`,
            _.keyBy(rowsForColumn, 'id'),
            { ifNotExists: true }
          ));
          return actions;
        }))));
        const inputSchemaId = db.output_schemas[outputSchemaId].input_schema_id;
        const rowErrors = withoutHeader.
          filter(row => row.error).
          map(row => ({
            ...row.error,
            id: `${inputSchemaId}-${row.offset}`,
            input_schema_id: inputSchemaId,
            offset: row.offset
          }));
        dispatch(insertMultipleFromServer(
          'row_errors', _.keyBy(rowErrors, 'id'), { ifNotExists: true }
        ));
      });
  };
}

export function loadColumnErrors(transformId, outputSchemaId, pageNo) {
  return (dispatch, getState) => {
    const db = getState().db;
    const { upload, inputSchema, outputSchema } = Selectors.pathForOutputSchema(db, outputSchemaId);
    const errorsColumnId = _.find(getState().db.output_columns, { transform_id: transformId }).id;
    const url = dsmapiLinks.columnErrors(
      upload.id, inputSchema.id, outputSchema.id, errorsColumnId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE
    );
    dispatch(loadStarted(url));
    socrataFetch(url).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        dispatch(loadSucceeded(url));
        const outputSchemaResp = resp[0];
        const withoutSchemaRow = resp.slice(1);
        const newRecordsByTransform = [];
        _.range(outputSchemaResp.output_columns.length).forEach(() => {
          newRecordsByTransform.push({});
        });
        withoutSchemaRow.forEach(({ row, offset }) => {
          if (_.isArray(row)) { // as opposed to row errors, which are not
            row.forEach((colResult, colIdx) => {
              newRecordsByTransform[colIdx][offset] = colResult;
            });
          }
        });
        dispatch(batch(newRecordsByTransform.map((newRecords, idx) => {
          const theTransformId = outputSchemaResp.output_columns[idx].transform.id;
          return insertMultipleFromServer(`transform_${theTransformId}`, newRecords, {
            ifNotExists: true
          });
        })));
        dispatch(batch(newRecordsByTransform.map((newRecords, idx) => {
          const errorIndices = _.map(newRecords, (newRecord, index) => ({
            ...newRecord,
            index
          })).
          filter(newRecord => newRecord.error).
          map(newRecord => newRecord.index);

          const transform = outputSchemaResp.output_columns[idx].transform;
          return updateFromServer('transforms', {
            id: transform.id,
            error_indices: (existingErrorIndices) => (
              _.union(existingErrorIndices, errorIndices)
            )
          });
        })));
      }).
      catch((error) => {
        dispatch(loadFailed(url, error));
        // TODO: maybe add a notification
        console.error('failed to load column errors', error);
      });
  };
}

export function loadRowErrors(inputSchemaId, pageNo) {
  return (dispatch, getState) => {
    const uploadId = getState().db.input_schemas[inputSchemaId].upload_id;
    const url = dsmapiLinks.rowErrors(uploadId, inputSchemaId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE);
    dispatch(loadStarted(url));
    socrataFetch(url).
      then(checkStatus).
      then(getJson).
      then((rows) => {
        dispatch(loadSucceeded(url));
        const rowErrorsWithId = rows.map((row) => ({
          ...row.error,
          id: `${inputSchemaId}-${row.offset}`,
          input_schema_id: inputSchemaId,
          offset: row.offset
        }));
        const rowErrorsKeyedById = _.keyBy(rowErrorsWithId, 'id');
        dispatch(insertMultipleFromServer('row_errors', rowErrorsKeyedById, { ifNotExists: true }));
      }).
      catch((error) => {
        dispatch(loadFailed(url, error));
        // TODO: maybe add a notification
        console.error('failed to load row errors', error);
      });
  };
}
