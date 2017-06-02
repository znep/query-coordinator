import _ from 'lodash';
import uuid from 'uuid';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import {
  batch,
  upsertMultipleFromServer,
  updateFromServer
} from 'actions/database';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  LOAD_ROWS
} from 'actions/apiCalls';
import * as DisplayState from 'lib/displayState';
import * as Selectors from 'selectors';
import * as dsmapiLinks from 'dsmapiLinks';

export const PAGE_SIZE = 50;

// only exported for tests...
export function needToLoadAnything({ apiCalls, db }, displayState) {
  // don't want to load if there's any matching api call -
  // succeeded, in progress, or failed.
  const previousApiCall = _.find(apiCalls, (call) => (
    _.isEqual(call.params.displayState, displayState)
  ));
  switch (displayState.type) {
    case DisplayState.NORMAL: {
      const { inputSchema } = Selectors.pathForOutputSchema(db, displayState.outputSchemaId);
      const columns = Selectors.columnsForOutputSchema(db, displayState.outputSchemaId);
      const minRowsProcessed = Selectors.rowsTransformed(columns);
      const firstRowNeeded = (displayState.pageNo - 1) * PAGE_SIZE;
      const lastRowNeeded = firstRowNeeded + PAGE_SIZE;

      const haveWholePage = minRowsProcessed >= lastRowNeeded;
      const doneLoadingThisPage = minRowsProcessed === inputSchema.total_rows &&
                                  minRowsProcessed >= firstRowNeeded;
      return (haveWholePage || doneLoadingThisPage) && !previousApiCall;
    }
    case DisplayState.ROW_ERRORS:
    case DisplayState.COLUMN_ERRORS:
      return !previousApiCall;

    default:
      throw new TypeError(`Unknown display state: ${displayState}`);
  }
}

export function loadVisibleData(displayState) {
  return (dispatch, getState) => {
    if (needToLoadAnything(getState(), displayState)) {
      dispatch(loadData({
        operation: LOAD_ROWS,
        params: { displayState }
      }));
    }
  };
}

function loadData(apiCall) {
  return (dispatch) => {
    switch (apiCall.params.displayState.type) {
      case DisplayState.NORMAL:
        dispatch(loadNormalPreview(apiCall));
        break;
      case DisplayState.ROW_ERRORS:
        dispatch(loadRowErrors(apiCall));
        break;
      case DisplayState.COLUMN_ERRORS:
        dispatch(loadColumnErrors(apiCall));
        break;
      default:
        throw new TypeError(`Unknown display state type: ${apiCall.displayState.type}`);
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

export function loadNormalPreview(apiCall) {
  return (dispatch, getState) => {
    const db = getState().db;
    const displayState = apiCall.params.displayState;
    const url = urlForPreview(db, displayState);
    const callId = uuid();

    dispatch(apiCallStarted(callId, apiCall));
    return socrataFetch(url).
      then(checkStatus).
      then(getJson).
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
        dispatch(apiCallSucceeded(callId));
      }).
      catch((error) => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}

export function loadColumnErrors(apiCall) {
  return (dispatch, getState) => {
    const db = getState().db;
    const displayState = apiCall.params.displayState;
    const url = urlForPreview(db, displayState);
    const callId = uuid();

    dispatch(apiCallStarted(callId, apiCall));
    return socrataFetch(url).
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

        const errorIndicesUpdateActions = newRecordsByTransform.
          map((newRecords, idx) => {
            const newErrorIndices = _.map(newRecords, (newRecord, index) => ({
              ...newRecord,
              index
            })).
            filter(newRecord => newRecord.error).
            map(newRecord => newRecord.index);

            const transform = outputSchemaResp.output_columns[idx].transform;

            if (newErrorIndices.length > 0) {
              return updateFromServer('transforms', {
                id: transform.id,
                error_indices: (existingErrorIndices) => (
                  setErrorIndicesForPage(
                    existingErrorIndices,
                    displayState.pageNo - 1,
                    newErrorIndices
                  )
                )
              });
            } else {
              return null;
            }
          }).
          filter(maybeAction => maybeAction !== null);

        dispatch(batch(errorIndicesUpdateActions));

        dispatch(apiCallSucceeded(callId));
      }).
      catch((error) => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}

/*
transform.error_indices is an array of row indices for that transform, s.t. when the user
is paging through column, we look up [pageNo*pageSize...pageNo*pageSize+pageSize], and then
use the resulting array of row indices to get the rows that we display.

The user can page through column errors non-contiguously by entering page numbers into the pager's
box. We then make an API call which gives us the error rows. Thus, to update error_indices, we have
to set an block of indices in the array to their row index values. Luckily, because JS arrays
are objects under the hood, we can do this.
*/
function setErrorIndicesForPage(existingErrorIndices, pageNo, newErrorIndices) {
  const cloned = _.clone(existingErrorIndices);
  const pageBase = pageNo * PAGE_SIZE;
  _.range(0, newErrorIndices.length).forEach((i) => {
    cloned[pageBase + i] = newErrorIndices[i];
  });
  return cloned;
}

export function loadRowErrors(apiCall) {
  return (dispatch, getState) => {
    const db = getState().db;
    const displayState = apiCall.params.displayState;
    const inputSchemaId = db.output_schemas[displayState.outputSchemaId].input_schema_id;
    const url = urlForPreview(db, displayState);
    const callId = uuid();

    dispatch(apiCallStarted(callId, apiCall));
    return socrataFetch(url).
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
        dispatch(apiCallSucceeded(callId));
      }).
      catch((error) => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}
