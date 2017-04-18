import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { commaify } from '../../common/formatNumber';
import * as dsmapiLinks from '../dsmapiLinks';
import { showModal } from 'actions/modal';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/ReadyToImport.scss';

const SubI18n = I18n.show_output_schema.ready_to_import;

const ReadyToImport = ({ upload, inputSchema, importableRows, errorRows, outputSchema, openModal }) => {
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
        <span data-cheetah-hook="error-rows" className={styles.errorRows}>{commaify(errorRows)}</span>
      </p>
      // TODO: add flyout to help icon
      <span
        className={styles.helpModalIcon}
        onClick={() => openModal('ErrorsHelp')}></span>
      {errorExportButton}
    </div>
  );
};

ReadyToImport.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  errorRows: PropTypes.number.isRequired,
  upload: PropTypes.object.isRequired,
  importableRows: PropTypes.number.isRequired,
  inputSchema: PropTypes.object.isRequired,
  openModal: PropTypes.func.isRequired
};

const mapStateToProps = ({ db, routing }) => {
  const outputSchema = db.output_schemas[routing.outputSchemaId];
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const upload = db.uploads[inputSchema.upload_id];
  const errorRows = outputSchema.error_count || 0;
  const importableRows = Math.max(0, inputSchema.total_rows - errorRows);

  return {
    upload,
    inputSchema,
    importableRows,
    errorRows,
    outputSchema
  };
};

const mapDispatchToProps = (dispatch) => ({
  openModal: componentName => dispatch(showModal(componentName))
});

export default connect(mapStateToProps, mapDispatchToProps)(ReadyToImport);