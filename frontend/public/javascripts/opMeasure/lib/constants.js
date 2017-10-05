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

// Breaking with classic enum convention here because we don't want to enforce an all uppercase API when dealing with measure calculation types.
// We decided to have slightly awkward enums here instead of awkward `toUpperCase()` everywhere we are comparing values
export const CalculationTypeNames = Object.freeze({
  COUNT: 'count',
  SUM: 'sum'
});
