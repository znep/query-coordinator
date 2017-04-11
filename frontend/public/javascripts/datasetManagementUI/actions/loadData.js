import _ from 'lodash';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import {
  batch,
  upsertMultipleFromServer,
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
export function getLoadPlan(db, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS: {
      const url = urlForPreview(db, displayState);
      const alreadyLoaded = _.find(db.__loads__, { url });

      if (!alreadyLoaded) {
        return {
          type: 'COLUMN_ERRORS',
          transformId: displayState.transformId,
          outputSchemaId: displayState.outputSchemaId,
          pageNo: displayState.pageNo
        };
      } else {
        return null;
      }
    }
    case DisplayState.ROW_ERRORS: {
      // kind of seems easier to only formulate the url once...
      // do a "here's the url, fetch it if we haven't already fetched it" kind of thing
      const inputSchemaId = db.output_schemas[displayState.outputSchemaId].input_schema_id;
      const url = urlForPreview(db, displayState);
      const alreadyLoaded = _.find(db.__loads__, { url });

      if (!alreadyLoaded) {
        return {
          type: 'ROW_ERRORS',
          pageNo: displayState.pageNo,
          inputSchemaId
        };
      } else {
        return null;
      }
    }
    case DisplayState.NORMAL: {
      const { inputSchema } = Selectors.pathForOutputSchema(db, displayState.outputSchemaId);
      const columns = Selectors.columnsForOutputSchema(db, displayState.outputSchemaId);
      const minRowsProcessed = Selectors.rowsTransformed(columns);
      const firstRowNeeded = (displayState.pageNo - 1) * PAGE_SIZE;
      const lastRowNeeded = firstRowNeeded + PAGE_SIZE;
      const alreadyLoaded = _.find(db.__loads__, { url: urlForPreview(db, displayState) });

      const haveWholePage = minRowsProcessed >= lastRowNeeded;
      const doneLoadingThisPage = minRowsProcessed === inputSchema.total_rows &&
                                  minRowsProcessed >= firstRowNeeded;

      if ((haveWholePage || doneLoadingThisPage) && !alreadyLoaded) {
        return {
          type: 'NORMAL',
          outputSchemaId: displayState.outputSchemaId,
          pageNo: displayState.pageNo
        };
      } else {
        return null;
      }
    }
    default:
      throw new TypeError(`Unknown display state: ${displayState}`);
  }
}

export function loadVisibleData(displayState) {
  return (dispatch, getState) => {
    const loadPlan = getLoadPlan(getState().db, displayState);
    if (loadPlan) {
      dispatch(executeLoadPlan(loadPlan, displayState));
    }
  };
}

function executeLoadPlan(loadPlan, displayState) {
  return (dispatch) => {
    switch (loadPlan.type) {
      case 'NORMAL':
        dispatch(loadNormalPreview(displayState));
        break;
      case 'ROW_ERRORS':
        dispatch(loadRowErrors(displayState));
        break;
      case 'COLUMN_ERRORS':
        dispatch(loadColumnErrors(displayState));
        break;
      default:
        throw new TypeError(`Unknown load plan type: ${loadPlan.type}`);
    }
  };
}

function urlForPreview(db, displayState) {
  const { upload, inputSchema } = Selectors.pathForOutputSchema(db, displayState.outputSchemaId);
  const { outputSchemaId } = displayState;
  const offset = PAGE_SIZE;
  const limit = (displayState.pageNo - 1) * PAGE_SIZE;

  switch (displayState.type) {
    case DisplayState.NORMAL:
      return dsmapiLinks.rows(upload.id, inputSchema.id, outputSchemaId, offset, limit);
    case DisplayState.ROW_ERRORS:
      return dsmapiLinks.rowErrors(upload.id, inputSchema.id, offset, limit);
    case DisplayState.COLUMN_ERRORS: {
      const columnId = _.find(db.output_columns, { transform_id: displayState.transformId }).id;

      return dsmapiLinks.columnErrors(upload.id, inputSchema.id, outputSchemaId, columnId, offset, limit);
    }
    default:
      throw new TypeError(`Unknown DisplayState: ${displayState.type}`);
  }
}

export function loadNormalPreview(displayState) {
  return (dispatch, getState) => {
    const db = getState().db;
    const url = urlForPreview(db, displayState);
    dispatch(loadStarted(url));
    socrataFetch(url).
      then(checkStatus).
      then(getJson).
      catch((error) => {
        console.error('failed to get transform results', error);
        dispatch(loadFailed(url, error));
      }).
      then((resp) => {
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
          actions.push(upsertMultipleFromServer(
            `transform_${transformId}`,
            _.keyBy(rowsForColumn, 'id'),
            { ifNotExists: true }
          ));
          return actions;
        }))));
        const inputSchemaId = db.output_schemas[displayState.outputSchemaId].input_schema_id;
        const rowErrors = withoutHeader.
          filter(row => row.error).
          map(row => ({
            ...row.error,
            id: `${inputSchemaId}-${row.offset}`,
            input_schema_id: inputSchemaId,
            offset: row.offset
          }));
        dispatch(upsertMultipleFromServer(
          'row_errors', _.keyBy(rowErrors, 'id'), { ifNotExists: true }
        ));
        dispatch(loadSucceeded(url));
      });
  };
}

export function loadColumnErrors(displayState) {
  return (dispatch, getState) => {
    const db = getState().db;
    const url = urlForPreview(db, displayState);

    dispatch(loadStarted(url));
    socrataFetch(url).
      then(checkStatus).
      then(getJson).
      then((resp) => {
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
          return upsertMultipleFromServer(`transform_${theTransformId}`, newRecords, {
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

        dispatch(loadSucceeded(url));
      }).
      catch((error) => {
        dispatch(loadFailed(url, error));
        // TODO: maybe add a notification
        console.error('failed to load column errors', error);
      });
  };
}

export function loadRowErrors(displayState) {
  return (dispatch, getState) => {
    const db = getState().db;
    const inputSchemaId = db.output_schemas[displayState.outputSchemaId].input_schema_id;
    const url = urlForPreview(db, displayState);

    dispatch(loadStarted(url));
    socrataFetch(url).
      then(checkStatus).
      then(getJson).
      then((rows) => {
        const rowErrorsWithId = rows.map((row) => ({
          ...row.error,
          id: `${inputSchemaId}-${row.offset}`,
          input_schema_id: inputSchemaId,
          offset: row.offset
        }));
        const rowErrorsKeyedById = _.keyBy(rowErrorsWithId, 'id');
        dispatch(upsertMultipleFromServer('row_errors', rowErrorsKeyedById, { ifNotExists: true }));
        dispatch(loadSucceeded(url));
      }).
      catch((error) => {
        dispatch(loadFailed(url, error));
        // TODO: maybe add a notification
        console.error('failed to load row errors', error);
      });
  };
}
