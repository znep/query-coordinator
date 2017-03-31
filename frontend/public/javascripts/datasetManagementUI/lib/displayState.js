import * as Links from '../links';

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
  const pageNo = _.toNumber(params.pageNo || '0');
  if (params.errorsTransformId) {
    return columnErrors(_.toNumber(params.errorsTransformId), pageNo);
  } else if (route.path.indexOf('row_errors') > 0) {
    return rowErrors(pageNo);
  } else {
    return normal(pageNo);
  }
}

export function toUiUrl(path, displayState) {
  switch (displayState.type) {
    case NORMAL:
      return Links.showOutputSchema(
        path.uploadId, path.inputSchemaId, path.outputSchemaId, displayState.pageNo
      );

    case ROW_ERRORS:
      return Links.showRowErrors(
        path.uploadId, path.inputSchemaId, path.outputSchemaId,
        displayState.pageNo
      );

    case COLUMN_ERRORS:
      return Links.showColumnErrors(
        path.uploadId, path.inputSchemaId, path.outputSchemaId, displayState.transformId,
        displayState.pageNo
      );
  }
}
