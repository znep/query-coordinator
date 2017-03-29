import _ from 'lodash';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import {
  batch,
  insertMultipleFromServer,
  loadStarted,
  loadSucceeded,
  loadFailed
} from '../actions/database';
import * as DisplayState from '../lib/displayState';
import * as Selectors from '../selectors';
import * as dsmapiLinks from '../dsmapiLinks';

export const PAGE_SIZE = 50;

function getLoadPlan(db, outputSchemaId, displayState) {
  // TODO: don't load anything if we've already loaded it or started to load it!!
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS:
      return {
        type: 'COLUMN_ERRORS',
        outputSchemaId,
        pageNo: displayState.pageNo
      };

    case DisplayState.ROW_ERRORS:
      return {
        type: 'ROW_ERRORS',
        outputSchemaId,
        pageNo: displayState.pageNo
      };

    case DisplayState.NORMAL: {
      const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);
      const minRowsProcessed = Selectors.rowsTransformed(columns);
      const firstRowNeeded = displayState.pageNo * PAGE_SIZE;
      const lastRowNeeded = firstRowNeeded + PAGE_SIZE;
      const load = _.find(db.__loads__, {
        url: urlForNormalPreview(db, outputSchemaId, displayState.pageNo)
      });
      if (minRowsProcessed >= lastRowNeeded && !load) {
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
    console.log('loadPlan', loadPlan);
    switch (loadPlan.type) {
      case 'NORMAL':
        dispatch(loadNormalPreview(loadPlan.outputSchemaId, loadPlan.pageNo));
        break;
      case 'ROW_ERRORS':
        break;
      case 'COLUMN_ERRORS':
        break;
      default:
        console.error('unknown load plan type', loadPlan.type);
    }
  };
}

// move to dsmapiLinks?
function urlForNormalPreview(db, outputSchemaId, pageNo) {
  const { upload, inputSchema } = Selectors.pathForOutputSchema(db, outputSchemaId);
  return dsmapiLinks.rows(
    upload.id, inputSchema.id, outputSchemaId, PAGE_SIZE, pageNo * PAGE_SIZE
  );
}

function loadNormalPreview(outputSchemaId, pageNo) {
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
        dispatch(batch(transformIds.map((transformId, colIdx) => {
          // transpose row-oriented response to columnar data structure
          const rowsForColumn = withoutHeader.
            filter((row) => row.row).
            map((row) => ({
              id: row.offset,
              ...row.row[colIdx]
            }));
          return insertMultipleFromServer(
            `transform_${transformId}`,
            _.keyBy(rowsForColumn, 'id'),
            { ifNotExists: true }
          );
          // console.warn('TODO: insert row error');
          // return insertFromServer('row_errors', {
          //   id: `${inputSchemaId}`
          // })
        })));
      });
  };
}

// export function loadColumnErrors(nextState) {
//   const {
//     uploadId,
//     inputSchemaId,
//     outputSchemaId,
//     errorsTransformId: errorsTransformIdStr
//   } = nextState.params;
//   const errorsTransformId = _.toNumber(errorsTransformIdStr);
//   return (dispatch, getState) => {
//     const limit = 50;
//     const fetchOffset = 0;
//     const errorsColumnId = _.find(getState().db.output_columns, { transform_id: errorsTransformId }).id;
//     const path = dsmapiLinks.columnErrors(
//       uploadId, inputSchemaId, outputSchemaId, errorsColumnId, limit, fetchOffset
//     );
//     socrataFetch(path).
//     then(checkStatus).
//     then(getJson).
//     then((resp) => {
//       const outputSchema = resp[0];
//       const withoutSchemaRow = resp.slice(1);
//       const newRecordsByTransform = [];
//       _.range(outputSchema.output_columns.length).forEach(() => {
//         newRecordsByTransform.push({});
//       });
//       withoutSchemaRow.forEach(({ row, offset }) => {
//         if (_.isArray(row)) { // as opposed to row errors, which are not
//           row.forEach((colResult, colIdx) => {
//             newRecordsByTransform[colIdx][offset] = colResult;
//           });
//         }
//       });
//       dispatch(batch(newRecordsByTransform.map((newRecords, idx) => {
//         const theTransformId = outputSchema.output_columns[idx].transform.id;
//         return insertMultipleFromServer(`transform_${theTransformId}`, newRecords, {
//           ifNotExists: true
//         });
//       })));
//       dispatch(batch(newRecordsByTransform.map((newRecords, idx) => {
//         const errorIndices = _.map(newRecords,
//           (newRecord, index) => ({
//             ...newRecord,
//             index
//           })).
//         filter((newRecord) => newRecord.error).
//         map((newRecord) => newRecord.index);
//         // TODO: how to make this a set which gets merged when we update?
//         // maybe update should just take a primary key and a function
//         // that would be SQL-like
//         // not supposed to have functions in actions though
//         // boo
//         const transform = outputSchema.output_columns[idx].transform;
//         return updateFromServer('transforms', {
//           id: transform.id,
//           error_indices: errorIndices
//         });
//       })));
//     }).
//     catch((error) => {
//       // TODO: maybe add a notification
//       console.error('failed to load column errors', error);
//     });
//   };
// }
//
//
// export function loadRowErrors(inputSchemaId, offset, limit) {
//   return (dispatch, getState) => {
//     const uploadId = getState().db.input_schemas[inputSchemaId].upload_id;
//     socrataFetch(dsmapiLinks.rowErrors(uploadId, inputSchemaId, offset, limit)).
//     then(checkStatus).
//     then(getJson).
//     then((rowErrors) => {
//       const rowErrorsWithId = rowErrors.map((rowError) => ({
//         ...rowError,
//         input_schema_id: inputSchemaId,
//         id: `${inputSchemaId}-${rowError.offset}`
//       }));
//       const rowErrorsKeyedById = _.keyBy(rowErrorsWithId, 'id');
//       dispatch(insertMultipleFromServer('row_errors', rowErrorsKeyedById, { ifNotExists: true }));
//     }).
//     catch((error) => {
//       // TODO: maybe add a notification
//       console.error('failed to load row errors', error);
//     });
//   };
// }
