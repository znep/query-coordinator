// There is a ton of repetition in this module because of the restrictions on
// module exports, namely the inability to generate exports programmatically.

export const VALIDATE_ALL = 'VALIDATE_ALL';
export const validateAll = () => ({
  type: VALIDATE_ALL
});

export const VALIDATE_MEASURE_NAME = 'VALIDATE_MEASURE_NAME';
export const validateMeasureName = () => ({
  type: VALIDATE_MEASURE_NAME
});

export const VALIDATE_MEASURE_SHORT_NAME = 'VALIDATE_MEASURE_SHORT_NAME';
export const validateMeasureShortName = () => ({
  type: VALIDATE_MEASURE_SHORT_NAME
});

export const VALIDATE_MEASURE_DESCRIPTION = 'VALIDATE_MEASURE_DESCRIPTION';
export const validateMeasureDescription = () => ({
  type: VALIDATE_MEASURE_DESCRIPTION
});
