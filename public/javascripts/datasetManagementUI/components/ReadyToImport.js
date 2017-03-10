import React, { PropTypes } from 'react';
import { commaify } from '../../common/formatNumber';
import * as dsmapiLinks from '../dsmapiLinks';

function query(db, outputSchema) {
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const errorRows = outputSchema.error_count || 0;
  const importableRows = Math.max(0, inputSchema.total_rows - errorRows);

  return {
    inputSchema,
    importableRows,
    errorRows
  };
}

export default function ReadyToImport({ db, outputSchema }) {
  const { inputSchema, importableRows, errorRows } = query(db, outputSchema);
  const SubI18n = I18n.show_output_schema.ready_to_import;

  let errorExportButton;
  const errorExportActualButton = (
    <button className="btn btn-default export-errors" disabled={!(outputSchema.error_count > 0)}>
      {I18n.export_errors} <span className="socrata-icon-download" />
    </button>
  );
  if (outputSchema.error_count > 0) {
    const errorTableLink = dsmapiLinks.errorExport(inputSchema.id, outputSchema.id);
    errorExportButton = (
      <a href={errorTableLink}>
        {errorExportActualButton}
      </a>
    );
  } else {
    errorExportButton = errorExportActualButton;
  }

  return (
    <div className="ready-to-import">
      <p>
        {SubI18n.ready_to_import}{' '}
        <span className="importable-rows">{commaify(importableRows)}</span>{' '}
        {SubI18n.rows}
      </p>
      <p>
        {SubI18n.will_not_be_imported} <span className="error-rows">{commaify(errorRows)}</span>
        <span className="errors-help socrata-icon-question" />
      </p>
      {errorExportButton}
    </div>
  );
}

ReadyToImport.propTypes = {
  db: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired
};
