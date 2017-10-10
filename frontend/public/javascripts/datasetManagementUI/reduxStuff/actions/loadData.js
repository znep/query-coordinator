import _ from 'lodash';
import uuid from 'uuid';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { apiCallStarted, apiCallSucceeded, apiCallFailed, LOAD_ROWS } from 'reduxStuff/actions/apiCalls';
import * as DisplayState from 'lib/displayState';
import * as Selectors from 'selectors';
import * as dsmapiLinks from 'links/dsmapiLinks';

export const PAGE_SIZE = 50;
export const LOAD_ROW_ERRORS_SUCCESS = 'LOAD_ROW_ERRORS_SUCCESS';
export const LOAD_COLUMN_ERRORS_SUCCESS = 'LOAD_COLUMN_ERRORS_SUCCESS';
export const LOAD_NORMAL_PREVIEW_SUCCESS = 'LOAD_NORMAL_PREVIEW_SUCCESS';

// only exported for tests...
export function needToLoadAnything(entities, apiCalls, displayState) {
  // don't want to load if there's any matching api call -
  // succeeded, in progress, or failed.
  const previousApiCall = _.find(apiCalls, call => _.isEqual(call.callParams.displayState, displayState));
  switch (displayState.type) {
    case DisplayState.NORMAL: {
      const { inputSchema } = Selectors.pathForOutputSchema(entities, displayState.outputSchemaId);
      const columns = Selectors.columnsForOutputSchema(entities, displayState.outputSchemaId);
      const minRowsProcessed = Selectors.rowsTransformed(columns);
      const firstRowNeeded = (displayState.pageNo - 1) * PAGE_SIZE;
      const lastRowNeeded = firstRowNeeded + PAGE_SIZE;
      const haveWholePage = minRowsProcessed >= lastRowNeeded;
      const doneLoadingThisPage =
        minRowsProcessed === inputSchema.total_rows && minRowsProcessed >= firstRowNeeded;
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
    const { entities, ui } = getState();
    if (needToLoadAnything(entities, ui.apiCalls, displayState)) {
      dispatch(
        loadData({
          operation: LOAD_ROWS,
          callParams: { displayState }
        })
      );
    }
  };
}

function loadData(apiCall) {
  return dispatch => {
    switch (apiCall.callParams.displayState.type) {
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

function urlForPreview(entities, displayState) {
  const { source, inputSchema } = Selectors.pathForOutputSchema(entities, displayState.outputSchemaId);
  const { outputSchemaId } = displayState;
  const offset = (displayState.pageNo - 1) * PAGE_SIZE;
  const limit = PAGE_SIZE;

  switch (displayState.type) {
    case DisplayState.NORMAL:
      return dsmapiLinks.rows(source.id, inputSchema.id, outputSchemaId, limit, offset);
    case DisplayState.ROW_ERRORS:
      return dsmapiLinks.rowErrors(source.id, inputSchema.id, limit, offset);
    case DisplayState.COLUMN_ERRORS: {
      const columnId = _.find(entities.output_columns, { transform_id: displayState.transformId }).id;

      return dsmapiLinks.columnErrors(source.id, inputSchema.id, outputSchemaId, columnId, limit, offset);
    }
    default:
      throw new TypeError(`Unknown DisplayState: ${displayState.type}`);
  }
}

export function loadNormalPreview(apiCall) {
  return (dispatch, getState) => {
    const { entities } = getState();
    const displayState = apiCall.callParams.displayState;
    const url = urlForPreview(entities, displayState);
    const callId = uuid();

    dispatch(apiCallStarted(callId, apiCall));
    return socrataFetch(url)
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        const transformIds = resp[0].output_columns.map(col => col.transform.id);

        // don't think we need this bc of filter?
        const withoutHeader = resp.slice(1);

        let colData = transformIds.map((transformId, colIdx) => {
          // result example [{id: 0, ok: 'main street'}, {id: 1, ok: 'elm street'}]
          const rowsForColumn = withoutHeader.filter(row => row.row).map(row => ({
            id: row.offset,
            ...row.row[colIdx]
          }));

          // _.keyBy turns the array into this:
          // { 0: {id: 0, ok: 'main-street'}, ... }
          // prob swap for normalizr
          return {
            transformId,
            ..._.keyBy(rowsForColumn, 'id')
          };
        });

        colData = colData.reduce(
          (acc, data) => ({
            ...acc,
            [data.transformId]: _.omit(data, 'transformId')
          }),
          {}
        );

        const inputSchemaId = entities.output_schemas[displayState.outputSchemaId].input_schema_id;

        let rowErrors = withoutHeader.filter(row => row.error).map(row => ({
          ...row.error,
          id: `${inputSchemaId}-${row.offset}`,
          input_schema_id: inputSchemaId,
          offset: row.offset
        }));

        rowErrors = _.keyBy(rowErrors, 'id');

        dispatch(loadNormalPreviewSuccess(colData, rowErrors));

        dispatch(apiCallSucceeded(callId));
      })
      .catch(error => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}

function loadNormalPreviewSuccess(colData, rowErrors) {
  return {
    type: LOAD_NORMAL_PREVIEW_SUCCESS,
    colData,
    rowErrors
  };
}

export function loadColumnErrors(apiCall) {
  return (dispatch, getState) => {
    const { entities } = getState();
    const displayState = apiCall.callParams.displayState;
    const url = urlForPreview(entities, displayState);
    const callId = uuid();

    dispatch(apiCallStarted(callId, apiCall));

    return socrataFetch(url)
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        const outputSchemaResp = resp[0];

        const withoutSchemaRow = resp.slice(1);

        // This will end up as an array of objects, each object representing a column.
        // This column object looks like: {0: {ok: true}, 1: {ok: 'dog'}}, etc. where
        // the keys correspond to col cell #, when going from top to bottom. Not sure
        // why this is named newRecordsByTransform.
        const newRecordsByTransform = [];

        _.range(outputSchemaResp.output_columns.length).forEach(() => {
          newRecordsByTransform.push({});
        });

        withoutSchemaRow.forEach(({ row, offset }) => {
          if (_.isArray(row)) {
            // as opposed to row errors, which are not
            row.forEach((colResult, colIdx) => {
              newRecordsByTransform[colIdx][offset] = colResult;
            });
          }
        });

        const colData = newRecordsByTransform
          .map((record, idx) => {
            const id = outputSchemaResp.output_columns[idx].transform.id;
            return {
              id,
              ...record
            };
          })
          .reduce(
            (acc, record) => ({
              ...acc,
              [record.id]: record
            }),
            {}
          );

        const transforms = newRecordsByTransform
          .map((newRecords, idx) => {
            const errorIndices = _.map(newRecords, (newRecord, index) => ({
              ...newRecord,
              index
            }))
            .filter(newRecord => newRecord.error)
            .map(newRecord => Number(newRecord.index));

            const id = outputSchemaResp.output_columns[idx].transform.id;

            return {
              id,
              error_indices: errorIndices
            };
          })
          .reduce(
            (acc, a) => ({
              ...acc,
              [a.id]: a
            }),
            {}
          );

        dispatch(loadColumnErrorsSuccess(colData, transforms));

        dispatch(apiCallSucceeded(callId));
      })
      .catch(error => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}

function loadColumnErrorsSuccess(colData, transforms) {
  return {
    type: LOAD_COLUMN_ERRORS_SUCCESS,
    colData,
    transforms
  };
}

export function loadRowErrors(apiCall) {
  return (dispatch, getState) => {
    const entities = getState().entities;
    const displayState = apiCall.callParams.displayState;
    const inputSchemaId = entities.output_schemas[displayState.outputSchemaId].input_schema_id;
    const url = urlForPreview(entities, displayState);
    const callId = uuid();

    dispatch(apiCallStarted(callId, apiCall));

    return socrataFetch(url)
      .then(checkStatus)
      .then(getJson)
      .then(rows => {
        const rowErrorsWithId = rows.map(row => ({
          ...row.error,
          id: `${inputSchemaId}-${row.offset}`,
          input_schema_id: inputSchemaId,
          offset: row.offset
        }));

        const rowErrorsKeyedById = _.keyBy(rowErrorsWithId, 'id');

        dispatch(loadRowErrorsSuccess(rowErrorsKeyedById));

        dispatch(apiCallSucceeded(callId));
      })
      .catch(error => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}

function loadRowErrorsSuccess(rowErrors) {
  return {
    type: LOAD_ROW_ERRORS_SUCCESS,
    rowErrors
  };
}
