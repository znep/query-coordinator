export const BATCH = 'BATCH';
export const batch = (operations) => ({
  type: BATCH,
  operations
});

export const EDIT = 'EDIT';
export const edit = (tableName, updates) => ({
  type: EDIT,
  tableName,
  updates
});

// used when the server pushes new info to us (e.g. over a web socket)
// and on initial page load
export const INSERT_FROM_SERVER = 'INSERT_FROM_SERVER';
export const insertFromServer = (tableName, newRecordOrRecords) => ({
  type: INSERT_FROM_SERVER,
  tableName,
  newRecordOrRecords
});

// Idempotent version of INSERT_FROM_SERVER.
export const INSERT_FROM_SERVER_IF_NOT_EXISTS = 'INSERT_FROM_SERVER_IF_NOT_EXISTS';
export const insertFromServerIfNotExists = (tableName, newRecord) => ({
  type: INSERT_FROM_SERVER_IF_NOT_EXISTS,
  tableName,
  newRecord
});

export const INSERT_FROM_SERVER_WITH_PK = 'INSERT_FROM_SERVER_WITH_PK';
export const insertFromServerWithPk = (tableName, newRecords) => ({
  type: INSERT_FROM_SERVER_WITH_PK,
  tableName,
  newRecords
});

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
export const updateFailed = (tableName, updates, error) => ({
  type: UPDATE_FAILED,
  tableName,
  updates,
  error
});

export const CREATE_TABLE = 'CREATE_TABLE';
export const createTable = (name) => ({
  type: CREATE_TABLE,
  name
});

// no delete actions because we never delete anything lol
