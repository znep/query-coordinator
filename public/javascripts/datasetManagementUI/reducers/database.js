import _ from 'lodash';
import {
  EDIT,
  INSERT_STARTED,
  INSERT_FROM_SERVER,
  INSERT_FROM_SERVER_IF_NOT_EXISTS,
  INSERT_SUCCEEDED,
  INSERT_FAILED,
  UPDATE_STARTED,
  UPDATE_PROGRESS,
  UPDATE_SUCCEEDED,
  UPDATE_FROM_SERVER,
  UPDATE_FAILED,
  CREATE_TABLE,
  BATCH
} from '../actions/database';
import {
  STATUS_DIRTY,
  statusDirty,
  statusSaved,
  statusSavedOnServer,
  STATUS_INSERTING,
  statusInserting,
  statusInsertFailed,
  statusUpdating,
  statusUpdateFailed
} from '../lib/database/statuses';
import { emptyDB } from '../lib/database/bootstrap';


// TODO: use ImmutableJS instead of Object Spread? It may shorten repetitive code here & improve speed
export default function dbReducer(db = emptyDB, action) {
  if (action.tableName && !db[action.tableName]) {
    throw new ReferenceError(`Table "${action.tableName}" does not exist!`);
  }

  switch (action.type) {
    case BATCH:
      return action.operations.reduce((dbSoFar, operation) => (
        dbReducer(dbSoFar, operation)
      ), db);

    case EDIT:
      return {
        ...db,
        [action.tableName]: updateIf(
          db[action.tableName],
          (record) => (record.id === action.updates.id),
          (record) => {
            const withUpdatedStatus = {
              ...record,
              __status__: record.__status__.type !== STATUS_DIRTY ?
                statusDirty(record) :
                record.__status__
            };
            return _.merge({}, withUpdatedStatus, action.updates);
          }
        )
      };

    case INSERT_FROM_SERVER_IF_NOT_EXISTS:
      if (!_.find(db[action.tableName], action.newRecord)) {
        // Same as INSERT_FROM_SERVER!
        return {
          ...db,
          [action.tableName]: [
            ...db[action.tableName],
            {
              ...action.newRecord,
              __status__: statusSavedOnServer
            }
          ]
        };
      } else {
        // Do nothing if already exists!
        return db;
      }
    case INSERT_FROM_SERVER: {
      const records = _.isArray(action.newRecordOrRecords) ?
        action.newRecordOrRecords :
        [action.newRecordOrRecords];
      return {
        ...db,
        [action.tableName]: [
          ...db[action.tableName],
          ...records.map((record) => ({
            ...record,
            __status__: statusSavedOnServer
          }))
        ]
      };
    }

      // TODO kind of want "new" state to match the "dirty" state updates have
    case INSERT_STARTED:
      return {
        ...db,
        [action.tableName]: [
          ...db[action.tableName],
          {
            ...action.newRecord,
            __status__: statusInserting(action.newRecord)
          }
        ]
      };

    case INSERT_SUCCEEDED:
      return {
        ...db,
        [action.tableName]: updateIf(
          db[action.tableName],
          (record) => (
            record.__status__.type === STATUS_INSERTING &&
            _.isEqual(record.__status__.newRecord, action.newRecord)
          ),
          (record) => {
            const withUpdatedStatus = {
              ...record,
              __status__: statusSaved()
            };
            return _.merge({}, withUpdatedStatus, action.additional);
          }
        )
      };

    case INSERT_FAILED:
      return {
        ...db,
        [action.tableName]: updateIf(
          db[action.tableName],
          (record) => (
            record.__status__.type === STATUS_INSERTING &&
            _.isEqual(record.__status__.newRecord, action.newRecord)
          ),
          (record) => ({
            ...record,
            __status__: statusInsertFailed(action.newRecord, action.error)
          })
        )
      };

    case UPDATE_STARTED:
      return {
        ...db,
        [action.tableName]: updateIf(
          db[action.tableName],
          (record) => (record.id === action.updates.id),
          (record) => ({
            ...record,
            __status__: statusUpdating(action.updates)
          })
        )
      };

    case UPDATE_SUCCEEDED:
      return {
        ...db,
        [action.tableName]: updateIf(
          db[action.tableName],
          (record) => (record.id === action.updatedRecord.id),
          (record) => ({
            ...record,
            __status__: statusSaved()
          })
        )
      };

    case UPDATE_FROM_SERVER:
      return {
        ...db,
        [action.tableName]: updateIf(
          db[action.tableName],
          (record) => (record.id === action.updates.id),
          (record) => {
            const withUpdatedStatus = {
              ...record,
              __status__: statusSavedOnServer
            };
            return _.merge({}, withUpdatedStatus, action.updates);
          }
        )
      };

    case UPDATE_PROGRESS:
      return {
        ...db,
        [action.tableName]: updateIf(
          db[action.tableName],
          (record) => (record.id === action.updates.id),
          (record) => ({
            ...record,
            __status__: {
              ...record.__status__,
              percentCompleted: action.percentCompleted
            }
          })
        )
      };

    case UPDATE_FAILED:
      return {
        ...db,
        [action.tableName]: updateIf(
          db[action.tableName],
          (record) => (record.id === action.updates.id),
          (record) => ({
            ...record,
            __status__: statusUpdateFailed(action.updates, action.error)
          })
        )
      };

    case CREATE_TABLE:
      return {
        ...db,
        [action.name]: []
      };

    default:
      return db;
  }
}


function updateIf(array, predicateOrMatch, updater) {
  if (!array) {
    throw new TypeError(`Expected Array but got ${array}!`);
  }

  const cloned = _.clone(array);
  const idx = _.findIndex(cloned, predicateOrMatch);
  cloned[idx] = updater(cloned[idx]);
  return cloned;
}
