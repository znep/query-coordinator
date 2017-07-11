import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { commaify } from '../../common/formatNumber';
import * as dsmapiLinks from '../dsmapiLinks';
import { showModal } from 'actions/modal';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/ReadyToImport.scss';

const SubI18n = I18n.show_output_schema.ready_to_import;

const ErrorButton = ({ disabled }) => (
  <button className={styles.errorsBtn} disabled={disabled}>
    {I18n.export_errors}{' '}
    <SocrataIcon name="download" />
  </button>
);

ErrorButton.propTypes = {
  disabled: PropTypes.bool
};

export const ReadyToImport = props => {
  const { source, inputSchema, importableRows, errorRows, outputSchema, openModal } = props;

  if (!outputSchema) {
    return null;
  }

  let errorExportButton;

  if (outputSchema.error_count > 0) {
    const errorTableLink = dsmapiLinks.errorExport(source.id, inputSchema.id, outputSchema.id);

    errorExportButton = (
      <a href={errorTableLink}>
        <ErrorButton disabled={false} />
      </a>
    );
  } else {
    errorExportButton = <ErrorButton disabled />;
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
      {/* TODO: add flyout to help icon*/}
      <span className={styles.helpModalIcon} onClick={() => openModal('ErrorsHelp')} />
      {errorExportButton}
    </div>
  );
};

ReadyToImport.propTypes = {
  outputSchema: PropTypes.object,
  errorRows: PropTypes.number,
  source: PropTypes.object,
  importableRows: PropTypes.number,
  inputSchema: PropTypes.object,
  openModal: PropTypes.func
};

const mapStateToProps = ({ entities, ui }) => {
  const { outputSchemaId } = ui.routing;

  if (outputSchemaId) {
    const outputSchema = entities.output_schemas[outputSchemaId];
    const inputSchema = entities.input_schemas[outputSchema.input_schema_id];
    const source = entities.sources[inputSchema.source_id];
    const errorRows = outputSchema.error_count || 0;
    const importableRows = Math.max(0, inputSchema.total_rows - errorRows);

    return {
      source,
      inputSchema,
      importableRows,
      errorRows,
      outputSchema
    };
  } else {
    return {};
  }
};

const mapDispatchToProps = dispatch => ({
  openModal: componentName => dispatch(showModal(componentName))
});

export default connect(mapStateToProps, mapDispatchToProps)(ReadyToImport);
