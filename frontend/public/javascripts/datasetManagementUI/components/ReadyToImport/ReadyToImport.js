import PropTypes from 'prop-types';
import React from 'react';
import { commaify } from '../../../common/formatNumber';
import * as dsmapiLinks from 'links/dsmapiLinks';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './ReadyToImport.module.scss';

const SubI18n = I18n.show_output_schema.ready_to_import;

const ErrorButton = ({ disabled }) => (
  <button className={styles.errorsBtn} disabled={disabled}>
    {I18n.export_errors} <SocrataIcon name="download" />
  </button>
);

ErrorButton.propTypes = {
  disabled: PropTypes.bool
};

const ReadyToImport = props => {
  const {
    source,
    inputSchema,
    importableRows,
    errorRows,
    outputSchema,
    openModal,
    createConfigAndOpenModal
  } = props;

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

  let automateButton;

  if (source.source_type.type === 'upload' &&
    window.serverConfig.featureFlags.socrata_py_automate_button) {
    automateButton = (<button
      className={styles.automationBtn}
      onClick={() => createConfigAndOpenModal()}>
      Automate This
    </button>);
  }

  return (
    <div className={styles.readyToImport}>
      <p>
        {SubI18n.ready_to_import} <span className={styles.importableRows}>
          {commaify(importableRows)}
        </span>{' '}
        {SubI18n.rows}
      </p>
      <p>
        {SubI18n.will_not_be_imported}{' '}
        <span data-cheetah-hook="error-rows" className={styles.errorRows}>
          {commaify(errorRows)}
        </span>
      </p>
      {/* TODO: add flyout to help icon*/}
      <span className={styles.helpModalIcon} onClick={() => openModal('ErrorsHelp')} />
      {automateButton}
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
  openModal: PropTypes.func,
  createConfigAndOpenModal: PropTypes.func.isRequired
};

export default ReadyToImport;
