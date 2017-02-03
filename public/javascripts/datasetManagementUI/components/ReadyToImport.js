import React, { PropTypes } from 'react';
import { commaify } from '../../common/formatNumber';

function query(db, outputSchema) {
  const inputSchema = _.find(db.input_schemas, { id: outputSchema.input_schema_id });
  const errorRows = outputSchema.error_count || 0;
  const importableRows = Math.max(0, inputSchema.total_rows - errorRows);

  return {
    importableRows,
    errorRows
  };
}

export default function ReadyToImport({ db, outputSchema }) {
  const { importableRows, errorRows } = query(db, outputSchema);
  const SubI18n = I18n.show_output_schema.ready_to_import;
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
    </div>
  );
}

ReadyToImport.propTypes = {
  db: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired
};
