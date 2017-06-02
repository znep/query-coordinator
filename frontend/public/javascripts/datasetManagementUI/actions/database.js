export const BATCH = 'BATCH';
export const batch = (operations) => ({
  type: BATCH,
  operations
});

// for when the user is editing an existing record which, when they hit save, will be saved
// as a new record, leaving the original one alone
export const EDIT_IMMUTABLE = 'EDIT_IMMUTABLE';
export const editImmutable = (tableName, updates) => ({
  type: EDIT_IMMUTABLE,
  tableName,
  updates
});

export const EDIT = 'EDIT';
export const edit = (tableName, updates) => ({
  type: EDIT,
  tableName,
  updates
});

export const REVERT_EDITS = 'REVERT_EDITS';
export const revertEdits = (tableName, recordId) => ({
  type: REVERT_EDITS,
  tableName,
  recordId
});

// used when the server pushes new info to us (e.g. over a web socket)
// and on initial page load
// Upsert will insert if record does not exist, and will overwrite if it does.
export const UPSERT_FROM_SERVER = 'UPSERT_FROM_SERVER';
export const upsertFromServer = (tableName, newRecord, options = {}) => ({
  type: UPSERT_FROM_SERVER,
  tableName,
  newRecord,
  options
});

export const UPSERT_MULTIPLE_FROM_SERVER = 'UPSERT_MULTIPLE_FROM_SERVER';
export const upsertMultipleFromServer = (tableName, newRecords, options = {}) => ({
  type: UPSERT_MULTIPLE_FROM_SERVER,
  tableName,
  newRecords,
  options
});

export const UPSERT_STARTED = 'UPSERT_STARTED';
export const upsertStarted = (tableName, newRecord) => ({
  type: UPSERT_STARTED,
  tableName,
  newRecord
});

export const UPSERT_SUCCEEDED = 'UPSERT_SUCCEEDED';
export const upsertSucceeded = (tableName, newRecord, additional) => ({
  type: UPSERT_SUCCEEDED,
  tableName,
  newRecord,
  additional
});

export const UPSERT_FAILED = 'UPSERT_FAILED';
export const upsertFailed = (tableName, newRecord, error) => ({
  type: UPSERT_FAILED,
  tableName,
  newRecord,
  error
});

export const UPDATE_FROM_SERVER = 'UPDATE_FROM_SERVER';
export const updateFromServer = (tableName, updates) => ({
  type: UPDATE_FROM_SERVER,
  tableName,
  updates
});

export const UPDATE_STARTED = 'UPDATE_STARTED';
export const updateStarted = (tableName, updates) => ({
  type: UPDATE_STARTED,
  tableName,
  updates
});

export const UPDATE_IMMUTABLE_STARTED = 'UPDATE_IMMUTABLE_STARTED';
export const updateImmutableStarted = (tableName, recordId) => ({
  type: UPDATE_IMMUTABLE_STARTED,
  tableName,
  recordId
});

export const UPDATE_PROGRESS = 'UPDATE_PROGRESS';
export const updateProgress = (tableName, updates, percentCompleted) => ({
  type: UPDATE_PROGRESS,
  tableName,
  updates,
  percentCompleted
});

export const UPDATE_SUCCEEDED = 'UPDATE_SUCCEEDED';
export const updateSucceeded = (tableName, updatedRecord) => ({
  type: UPDATE_SUCCEEDED,
  tableName,
  updatedRecord
});

export const UPDATE_FAILED = 'UPDATE_FAILED';
export const updateFailed = (tableName, updates, error, percentCompleted) => ({
  type: UPDATE_FAILED,
  tableName,
  updates,
  error,
  percentCompleted
});

export const CREATE_TABLE = 'CREATE_TABLE';
export const createTable = (name) => ({
  type: CREATE_TABLE,
  name
});

// no delete actions because we never delete anything lol

export const SET_VIEW = 'SET_VIEW';
export const setView = newView => ({
  type: SET_VIEW,
  id: newView.id,
  payload: newView
});
