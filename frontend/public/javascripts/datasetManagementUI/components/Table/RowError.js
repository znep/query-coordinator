import React, { PropTypes } from 'react';

export default function RowError({ rowError }) {
  const SubI18n = I18n.show_output_schema.row_errors;
  return (
    <td>
      <span className="malformed-row-tag error">!</span>
      <span className="malformed-row-location">{SubI18n.row} {rowError.offset}:</span>
      <span className="malformed-row-error">
        {SubI18n.expected} <span className="row-error-number">{rowError.error.wanted}</span>&nbsp;
        {SubI18n.columns_found}&nbsp;
        <span className="row-error-number">{rowError.error.got}</span>
      </span>
      <span className="malformed-row-contents">
        <span className="row-content-label">{SubI18n.row_content}:</span>&nbsp;
        {rowError.error.contents.map((cell) => `"${cell.replace('"', '\\"')}"`).join(',')}
      </span>
    </td>
  );
}

RowError.propTypes = {
  rowError: PropTypes.object.isRequired
};
