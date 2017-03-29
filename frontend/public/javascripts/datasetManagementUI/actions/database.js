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
export const INSERT_FROM_SERVER = 'INSERT_FROM_SERVER';
export const insertFromServer = (tableName, newRecord, options = {}) => ({
  type: INSERT_FROM_SERVER,
  tableName,
  newRecord,
  options: _.defaults(options, { ifNotExists: false })
});

export const INSERT_MULTIPLE_FROM_SERVER = 'INSERT_MULTIPLE_FROM_SERVER';
export const insertMultipleFromServer = (tableName, newRecords, options = {}) => ({
  type: INSERT_MULTIPLE_FROM_SERVER,
  tableName,
  newRecords,
  options: _.defaults(options, { ifNotExists: false })
});

// Idempotent version of INSERT_FROM_SERVER.
export const insertFromServerIfNotExists = (tableName, newRecord) =>
  insertFromServer(tableName, newRecord, { ifNotExists: true });

export const INSERT_STARTED = 'INSERT_STARTED';
export const insertStarted = (tableName, newRecord) => ({
  type: INSERT_STARTED,
  tableName,
  newRecord
});

export const INSERT_SUCCEEDED = 'INSERT_SUCCEEDED';
export const insertSucceeded = (tableName, newRecord, additional) => ({
  type: INSERT_SUCCEEDED,
  tableName,
  newRecord,
  additional
});

export const INSERT_FAILED = 'INSERT_FAILED';
export const insertFailed = (tableName, newRecord, error) => ({
  type: INSERT_FAILED,
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

export const LOAD_STARTED = 'LOAD_STARTED';
export const loadStarted = (url) => ({
  type: LOAD_STARTED,
  url
});

export const LOAD_SUCCEEDED = 'LOAD_SUCCEEDED';
export const loadSucceeded = (url) => ({
  type: LOAD_SUCCEEDED,
  url
});

export const LOAD_FAILED = 'STATUS_LOAD_FAILED';
export const loadFailed = (url, error) => ({
  type: LOAD_FAILED,
  url,
  error
});
