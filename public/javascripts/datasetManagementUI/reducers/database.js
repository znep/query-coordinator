import _ from 'lodash';
import {
  EDIT,
  EDIT_IMMUTABLE,
  REVERT_EDITS,
  INSERT_STARTED,
  INSERT_FROM_SERVER,
  INSERT_MULTIPLE_FROM_SERVER,
  INSERT_SUCCEEDED,
  INSERT_FAILED,
  UPDATE_STARTED,
  UPDATE_IMMUTABLE_STARTED,
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
  STATUS_DIRTY_IMMUTABLE,
  statusDirtyImmutable,
  statusSaved,
  statusSavedOnServer,
  STATUS_INSERTING,
  statusInserting,
  statusInsertFailed,
  statusUpdating,
  statusUpdatingImmutable,
  statusUpdateFailed
} from '../lib/database/statuses';
import { emptyDB } from '../bootstrap';
import uuidV4 from 'uuid/v4';

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
      return editRecord(db, action, false);

    case EDIT_IMMUTABLE:
      return editRecord(db, action, true);

    case REVERT_EDITS:
      return updateRecord(db, action.tableName, action.recordId, (record) => ({
        ...record.__status__.oldRecord,
        __status__: statusSavedOnServer
      }));

    case INSERT_FROM_SERVER: {
      if (db[action.tableName][action.newRecord.id]) {
        if (action.options.ifNotExists) {
          return db;
        } else {
          throw new ReferenceError(
            `insertFromServer: record in table "${action.tableName}" ` +
            `with id ${action.newRecord.id} already exists`
          );
        }
      } else {
        return {
          ...db,
          [action.tableName]: {
            ...db[action.tableName],
            [action.newRecord.id]: {
              ...action.newRecord,
              __status__: statusSavedOnServer
            }
          }
        };
      }
    }

    case INSERT_MULTIPLE_FROM_SERVER: {
      const intersection = _.intersection(_.keys(action.newRecords), _.keys(db[action.tableName]));
      if (!action.options.ifNotExists && intersection.length > 0) {
        throw new ReferenceError(
          `insertMultipleFromServer: records in table "${action.tableName}" ` +
          `with ids ${intersection} already exist`
        );
      }
      _.forEach(action.newRecords, (newRecord) => {
        newRecord.__status__ = statusSavedOnServer;
      });
      return {
        ...db,
        [action.tableName]: _.assign({}, db[action.tableName], action.newRecords)
      };
    }

    // TODO kind of want "new" state to match the "dirty" state updates have
    case INSERT_STARTED: {
      const uuid = `saving-${uuidV4()}`;
      return {
        ...db,
        [action.tableName]: {
          ...db[action.tableName],
          [uuid]: {
            ...action.newRecord,
            id: uuid,
            __status__: statusInserting()
          }
        }
      };
    }

    case INSERT_SUCCEEDED: {
      const key = _.findKey(
        db[action.tableName],
        (tableRecord) => (
          tableRecord.__status__.type === STATUS_INSERTING &&
            _.isEqual(_.omit(tableRecord, ['__status__', 'id']), action.newRecord)
        )
      );
      const record = db[action.tableName][key];
      const newTable = _.clone(db[action.tableName]);
      delete newTable[key];
      if (newTable[action.additional.id]) {
        throw new ReferenceError(
          `insertSucceeded: record in table ${action.tableName} ` +
          `with id ${action.additional.id} already exists`
        );
      }
      newTable[action.additional.id] = {
        ...record,
        ...action.additional,
        __status__: statusSaved()
      };
      return {
        ...db,
        [action.tableName]: newTable
      };
    }

    case INSERT_FAILED: {
      const key = _.findKey(
        db[action.tableName],
        (tableRecord) => (
          tableRecord.__status__.type === STATUS_INSERTING &&
          _.isEqual(_.omit(tableRecord, ['__status__', 'id']), action.newRecord)
        )
      );
      const record = db[action.tableName][key];
      return {
        ...db,
        [action.tableName]: {
          ...db[action.tableName],
          [key]: {
            ...record,
            __status__: statusInsertFailed(action.newRecord, action.error)
          }
        }
      };
    }

    case UPDATE_STARTED:
      return updateRecord(db, action.tableName, action.updates.id, (record) => ({
        ...record,
        __status__: statusUpdating(action.updates)
      }));

    case UPDATE_IMMUTABLE_STARTED:
      return updateRecord(db, action.tableName, action.recordId, (record) => ({
        ...record,
        __status__: record.__status__ === STATUS_DIRTY_IMMUTABLE ?
          statusUpdatingImmutable(record.__status__.oldRecord) :
          statusUpdatingImmutable(record)
      }));

    case UPDATE_SUCCEEDED:
      return updateRecord(db, action.tableName, action.updatedRecord.id, (record) => ({
        ...record,
        __status__: statusSaved()
      }));

    case UPDATE_FROM_SERVER:
      return updateRecord(db, action.tableName, action.updates.id, (record) => {
        const withUpdatedStatus = {
          ...record,
          __status__: statusSavedOnServer
        };
        return _.merge({}, withUpdatedStatus, action.updates);
      });

    case UPDATE_PROGRESS:
      return updateRecord(db, action.tableName, action.updates.id, (record) => ({
        ...record,
        __status__: {
          ...record.__status__,
          percentCompleted: action.percentCompleted
        }
      }));

    case UPDATE_FAILED:
      return updateRecord(db, action.tableName, action.updates.id, (record) => ({
        ...record,
        __status__: statusUpdateFailed(action.updates, action.error, action.percentCompleted)
      }));

    case CREATE_TABLE:
      return {
        ...db,
        [action.name]: {}
      };

    default:
      return db;
  }
}

function editRecord(db, action, isImmutable) {
  return updateRecord(
    db,
    action.tableName,
    action.updates.id,
    (record) => {
      const updated = _.merge({}, record, action.updates);
      if (record.__status__.type === STATUS_DIRTY ||
          record.__status__.type === STATUS_DIRTY_IMMUTABLE) {
        const editedBackToOriginal = _.isEqual(
          _.omit(updated, '__status__'),
          _.omit(record.__status__.oldRecord, '__status__')
        );
        if (editedBackToOriginal) {
          return {
            ...record.__status__.oldRecord,
            __status__: statusSavedOnServer
          };
        } else {
          return {
            ...updated,
            __status__: record.__status__
          };
        }
      } else {
        return {
          ...updated,
          __status__: isImmutable ? statusDirtyImmutable(record) : statusDirty(record)
        };
      }
    }
  );
}

function updateRecord(db, tableName, id, updater) {
  const record = db[tableName][id];
  return {
    ...db,
    [tableName]: {
      ...db[tableName],
      [id]: updater(record)
    }
  };
}
