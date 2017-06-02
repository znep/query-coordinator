// TODO: move these constants to some other file
// these actions should be reusable with another set of operations
export const LOAD_ROWS = 'LOAD_ROWS';
export const VALIDATE_ROW_IDENTIFIER = 'VALIDATE_ROW_IDENTIFIER';
export const SET_ROW_IDENTIFIER = 'SET_ROW_IDENTIFIER';
export const DROP_COLUMN = 'DROP_COLUMN';
export const ADD_COLUMN = 'ADD_COLUMN';
export const UPDATE_COLUMN_TYPE = 'UPDATE_COLUMN_TYPE';
export const SAVE_DATASET_METADATA = 'SAVE_DATASET_METADATA';
export const SAVE_COLUMN_METADATA = 'SAVE_COLUMN_METADATA';
export const APPLY_REVISION = 'APPLY_REVISION';
export const ADD_EMAIL_INTEREST = 'ADD_EMAIL_INTEREST';

export const COLUMN_OPERATIONS = [
  SET_ROW_IDENTIFIER,
  VALIDATE_ROW_IDENTIFIER,
  DROP_COLUMN,
  ADD_COLUMN,
  UPDATE_COLUMN_TYPE
];

// TODO: factor these to just be params, not an object
export const API_CALL_STARTED = 'API_CALL_STARTED';
export const apiCallStarted = (id, { operation, params }) => ({
  type: API_CALL_STARTED,
  id,
  operation,
  params
});

export const API_CALL_SUCCEEDED = 'API_CALL_SUCCEEDED';
export const apiCallSucceeded = (id) => ({
  type: API_CALL_SUCCEEDED,
  id
});

export const API_CALL_FAILED = 'API_CALL_FAILED';
export const apiCallFailed = (id, error) => ({
  type: API_CALL_FAILED,
  id,
  error
});
