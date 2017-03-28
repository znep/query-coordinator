import React, { PropTypes } from 'react';
import { commaify } from '../../common/formatNumber';
import * as dsmapiLinks from '../dsmapiLinks';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/ReadyToImport.scss';

function query(db, outputSchema) {
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const upload = db.uploads[inputSchema.upload_id];
  const errorRows = outputSchema.error_count || 0;
  const importableRows = Math.max(0, inputSchema.total_rows - errorRows);

  return {
    upload,
    inputSchema,
    importableRows,
    errorRows
  };
}

export default function ReadyToImport({ db, outputSchema }) {
  const { upload, inputSchema, importableRows, errorRows } = query(db, outputSchema);
  const SubI18n = I18n.show_output_schema.ready_to_import;

  let errorExportButton;
  const errorExportActualButton = (
    <button className={styles.errorsBtn} disabled={!(outputSchema.error_count > 0)}>
      {I18n.export_errors}
      <SocrataIcon name="download" />
    </button>
  );
  if (outputSchema.error_count > 0) {
    const errorTableLink = dsmapiLinks.errorExport(upload.id, inputSchema.id, outputSchema.id);
    errorExportButton = (
      <a href={errorTableLink}>
        {errorExportActualButton}
      </a>
    );
  } else {
    errorExportButton = errorExportActualButton;
  }

  return (
    <div className={styles.readyToImport}>
      <p>
        {SubI18n.ready_to_import}{' '}
        <span className={styles.importableRows}>{commaify(importableRows)}</span>{' '}
        {SubI18n.rows}
      </p>
      <p>
        {SubI18n.will_not_be_imported}{' '}
        <span className={styles.errorRows}>{commaify(errorRows)}</span>
        <SocrataIcon name="question" className={styles.errorsHelp} />
      </p>
      {errorExportButton}
    </div>
  );
}

ReadyToImport.propTypes = {
  db: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired
};
