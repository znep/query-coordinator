export const NORMAL = 'NORMAL';
export const normal = (pageNo = 0) => ({
  type: NORMAL,
  pageNo
});

export const COLUMN_ERRORS = 'COLUMN_ERRORS';
export const columnErrors = (transformId, pageNo = 0) => ({
  type: COLUMN_ERRORS,
  transformId,
  pageNo
});

export const ROW_ERRORS = 'ROW_ERRORS';
export const rowErrors = (pageNo = 0) => ({
  type: ROW_ERRORS,
  pageNo
});
