export const ModeStates = Object.freeze({
  EDIT: 'EDIT',
  PREVIEW: 'PREVIEW',
  VIEW: 'VIEW'
});

export const SaveStates = Object.freeze({
  IDLE: 'IDLE',
  SAVING: 'SAVING',
  SAVED: 'SAVED',
  ERRORED: 'ERRORED'
});

export const DataSourceStates = Object.freeze({
  VALID: 'VALID',
  INVALID: 'INVALID',
  NO_ROWS: 'NO_ROWS'
});
