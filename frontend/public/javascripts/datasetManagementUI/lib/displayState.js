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

export function fromUrl({ params, route }) {
  if (params.errorsTransformId) {
    return columnErrors(_.toNumber(params.errorsTransformId));
  } else if (route.path.indexOf('row_errors') > 0) {
    return rowErrors();
  } else {
    return normal();
  }
}
