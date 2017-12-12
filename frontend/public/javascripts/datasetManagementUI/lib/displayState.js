import _ from 'lodash';
import PropTypes from 'prop-types';
import * as Links from 'links/links';

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

export function fromUiUrl({ params, location }) {
  const pageNo = _.toNumber(params.pageNo || '1');
  const outputSchemaId = _.toNumber(params.outputSchemaId);
  if (params.errorsTransformId) {
    return columnErrors(_.toNumber(params.errorsTransformId), pageNo, outputSchemaId);
  } else if (location.pathname.indexOf('row_errors') > 0) {
    return rowErrors(pageNo, outputSchemaId);
  } else {
    return normal(pageNo, outputSchemaId);
  }
}

export function toUiUrl(params, displayState) {
  switch (displayState.type) {
    case NORMAL:
      return Links.showOutputSchema(
        params,
        params.sourceId,
        params.inputSchemaId,
        params.outputSchemaId,
        displayState.pageNo
      );

    case ROW_ERRORS:
      return Links.showRowErrors(
        params,
        params.sourceId,
        params.inputSchemaId,
        params.outputSchemaId,
        displayState.pageNo
      );

    case COLUMN_ERRORS:
      return Links.showColumnErrors(
        params,
        params.sourceId,
        params.inputSchemaId,
        params.outputSchemaId,
        displayState.transformId,
        displayState.pageNo
      );

    default:
      console.error('unknown display state type', displayState.type);
  }
}

export function inErrorMode(displayState, transform) {
  return displayState.type === COLUMN_ERRORS && transform.id === displayState.transformId;
}

export const propType = PropTypes.shape({
  type: PropTypes.oneOf([NORMAL, COLUMN_ERRORS, ROW_ERRORS]).isRequired,
  pageNo: PropTypes.number.isRequired,
  outputSchemaId: PropTypes.number.isRequired,
  transformId: PropTypes.number
});
