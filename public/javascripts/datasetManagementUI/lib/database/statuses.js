export const STATUS_DIRTY = 'DIRTY';
export function statusDirty(oldRecord) {
  return {
    type: STATUS_DIRTY,
    dirtiedAt: new Date(),
    oldRecord
  };
}

export const STATUS_DIRTY_IMMUTABLE = 'DIRTY_IMMUTABLE';
export function statusDirtyImmutable(oldRecord) {
  return {
    type: STATUS_DIRTY_IMMUTABLE,
    dirtiedAt: new Date(),
    oldRecord
  };
}

export const STATUS_SAVED = 'SAVED';
export function statusSaved() {
  return {
    type: STATUS_SAVED,
    savedAt: new Date()
  };
}

export const statusSavedOnServer = {
  type: STATUS_SAVED,
  savedAt: 'ON_SERVER' // TODO: if record has updated_at, just get that
};

export const STATUS_FAILED_SAVED = 'FAILED_SAVED';
export function statusFailedOnServer(newRecord, error) {
  return {
    type: STATUS_FAILED_SAVED,
    newRecord,
    error,
    savedAt: newRecord.failed_at || 'ON_SERVER'
  };
}

export const STATUS_INSERTING = 'INSERTING';
export function statusInserting() {
  return {
    type: STATUS_INSERTING,
    startedAt: new Date()
  };
}

export const STATUS_INSERT_FAILED = 'INSERT_FAILED';
export function statusInsertFailed(newRecord, error) {
  return {
    type: STATUS_INSERT_FAILED,
    newRecord,
    error,
    failedAt: new Date()
  };
}

export const STATUS_UPDATING = 'UPDATING';
export function statusUpdating(updates) {
  return {
    type: STATUS_UPDATING,
    updates,
    startedAt: new Date(),
    percentCompleted: 0
  };
}

export const STATUS_UPDATING_IMMUTABLE = 'UPDATING_IMMUTABLE';
export function statusUpdatingImmutable(oldRecord) {
  return {
    type: STATUS_UPDATING_IMMUTABLE,
    startedAt: new Date(),
    oldRecord
  };
}

export const STATUS_UPDATE_FAILED = 'UPDATE_FAILED';
export function statusUpdateFailed(updates, error, percentCompleted) {
  return {
    type: STATUS_UPDATE_FAILED,
    updates,
    error,
    percentCompleted,
    failedAt: new Date()
  };
}
