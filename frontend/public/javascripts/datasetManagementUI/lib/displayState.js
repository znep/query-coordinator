import * as Links from '../links';

export const NORMAL = 'NORMAL';
export const normal = (pageNo, outputSchemaId) => ({
  type: NORMAL,
  pageNo,
  outputSchemaId
});

export const COLUMN_ERRORS = 'COLUMN_ERRORS';
export const columnErrors = (transformId, pageNo, outputSchemaId) => ({
  type: COLUMN_ERRORS,
  transformId,
  pageNo,
  outputSchemaId
});

export const ROW_ERRORS = 'ROW_ERRORS';
export const rowErrors = (pageNo, outputSchemaId) => ({
  type: ROW_ERRORS,
  pageNo,
  outputSchemaId
});

export function fromUiUrl({ params, route }) {
  const pageNo = _.toNumber(params.pageNo || '1');
  if (params.errorsTransformId) {
    return columnErrors(_.toNumber(params.errorsTransformId), pageNo, params.outputSchemaId);
  } else if (route.path.indexOf('row_errors') > 0) {
    return rowErrors(pageNo, params.outputSchemaId);
  } else {
    return normal(pageNo, params.outputSchemaId);
  }
}

export function toUiUrl(path, displayState) {
  switch (displayState.type) {
    case NORMAL:
      return Links.showOutputSchema(
        path.uploadId,
        path.inputSchemaId,
        path.outputSchemaId,
        displayState.pageNo
      );

    case ROW_ERRORS:
      return Links.showRowErrors(
        path.uploadId,
        path.inputSchemaId,
        path.outputSchemaId,
        displayState.pageNo
      );

    case COLUMN_ERRORS:
      return Links.showColumnErrors(
        path.uploadId,
        path.inputSchemaId,
        path.outputSchemaId,
        displayState.transformId,
        displayState.pageNo
      );

    default:
      console.error('unknown display state type', displayState.type);
  }
}
