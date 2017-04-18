import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { commaify } from '../../common/formatNumber';
import * as dsmapiLinks from '../dsmapiLinks';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/ReadyToImport.scss';
import styleguide from 'socrata-components';
import { nextHelpItem, closeHelpModal, openHelpModal, previousHelpItem } from '../actions/readyToImport';
import classNames from 'classnames';

const { Modal, ModalHeader, ModalContent, ModalFooter } = styleguide;
const SubI18n = I18n.show_output_schema.ready_to_import;

class ReadyToImport extends Component {
  errorString(start, end) {
    return (<span>
      {SubI18n.help_modal[start]}
      <span className={styles.errorCount}> {this.props.errorRows} </span>
      {SubI18n.help_modal[end]}
    </span>);
  }

  modal(title, content) {
    const { nextModal, modalIndex, previousModal, closeModal } = this.props;

    const isDone = modalIndex === (this.modals().length - 1);
    const buttonText = isDone ? SubI18n.help_modal.done : SubI18n.help_modal.next;
    const modalProps = {
      onDismiss: closeModal,
      className: styles.modalInception
    };

    const headerProps = {
      title,
      onDismiss: closeModal
    };

    const previousButton = modalIndex > 0 ? (
      <button
        onClick={previousModal}
        className={styles.previousButton}>
        {SubI18n.help_modal.previous}
      </button>) : null;

    return (
      <Modal {...modalProps} >
        <styleguide.ModalHeader {...headerProps} />
        <ModalContent>
          {content}
        </ModalContent>
        <ModalFooter>
          {this.dots()}

          {previousButton}
          <button
            onClick={nextModal}
            className={styles.nextButton}>
            {buttonText}
          </button>
        </ModalFooter>
      </Modal>
    );
  }

  whyWontTheyImport() {
    return this.modal(this.errorString('why_wont_start', 'why_wont_end'),
      <div className="help">
        <p>
          {SubI18n.help_modal.we_love_your_data}&nbsp;
          <span className={styles.typesOfErrors}>{SubI18n.help_modal.two_types_of_errors}</span>
        </p>

        <div className="kinds">
          <div className="type-errors">
            <h6>{SubI18n.help_modal.type_errors}</h6>
            <img
              alt="{SubI18n.help_modal.type_errors}"
              className={styles.helpVis1a}
              src="/images/datasetManagementUI/help-visual-1a.png" />
            <p className={styles.caption}>{SubI18n.help_modal.type_error_blurb}</p>
          </div>
          <div className="row-errors">
            <h6>{SubI18n.help_modal.row_errors}</h6>
            <img
              alt="{SubI18n.help_modal.row_errors}"
              className={styles.helpVis1b}
              src="/images/datasetManagementUI/help-visual-1b.png" />
            <p className={styles.caption}>{SubI18n.help_modal.row_error_blurb}</p>
          </div>
        </div>
      </div>
    );
  }

  whatCanIDoAboutIt() {
    return this.modal(SubI18n.help_modal.error_file,
      <div className="help">
        <p>{SubI18n.help_modal.error_file_blurb}</p>
        <h6>{this.errorString('you_can_download_start', 'you_can_download_end')}</h6>
        <img
          alt="{SubI18n.help_modal.error_file_blurb}"
          className={styles.helpVis2}
          src="/images/datasetManagementUI/help-visual-2.png" />
        <p className={styles.caption}>{SubI18n.help_modal.error_file_sub_blurb}</p>
      </div>
    );
  }

  howToGetRowsBackInDataset() {
    return this.modal(this.errorString('clean_data_start', 'clean_data_end'),
      <div className="help">
        <p>{SubI18n.help_modal.get_rows_into_dataset_blurb}</p>
        <h6>{SubI18n.help_modal.clean_data_blurb}</h6>
        <img
          alt="{SubI18n.help_modal.get_rows_into_dataset_blurb}"
          className={styles.helpVis3}
          src="/images/datasetManagementUI/help-visual-3.png" />
        <p className={styles.caption}>{SubI18n.help_modal.clean_data_sub_blurb}</p>
      </div>
    );
  }

  dots() {
    const { modalIndex } = this.props;
    const dots = this.modals().map((_, i) => (
      <div
        key={`${i}`}
        className={classNames(styles.dot, { [styles.dotSelected]: i === modalIndex })}>
        &middot;
      </div>
    ));
    return (
      <div className={styles.dotsWrap}>
        <div className={styles.dots}>{dots}</div>
      </div>
    );
  }

  modals() {
    return [this.whyWontTheyImport, this.whatCanIDoAboutIt, this.howToGetRowsBackInDataset];
  }

  render() {
    const {
      upload,
      inputSchema,
      importableRows,
      errorRows,
      outputSchema,
      modalVisible,
      modalIndex,
      openModal
    } = this.props;

    // const modal = modalVisible ? this.modals()[modalIndex].bind(this)() : null;

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
      <div
        className={styles.readyToImport}
        ref={(flyoutParentEl) => { this.flyoutParentEl = flyoutParentEl; }}>
        <p>
          {SubI18n.ready_to_import}{' '}
          <span className={styles.importableRows}>{commaify(importableRows)}</span>{' '}
          {SubI18n.rows}
        </p>
        <p>
          {SubI18n.will_not_be_imported}{' '}
          <span data-cheetah-hook="error-rows" className={styles.errorRows}>{commaify(errorRows)}</span>
        </p>
        <div className={styles.errorsHelpFlyout} id="error-help-flyout">
          this is awful
        </div>

        <span
          className={styles.helpModalIcon}
          data-flyout="error-help-flyout"
          onClick={openModal}></span>
        {errorExportButton}
      </div>
    );
  }
}


ReadyToImport.propTypes = {
  db: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  errorRows: PropTypes.number.isRequired,
  upload: PropTypes.object.isRequired,
  importableRows: PropTypes.number.isRequired,
  inputSchema: PropTypes.object.isRequired
};

const mapStateToProps = ({ readyToImport }, { db, outputSchema }) => {
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const upload = db.uploads[inputSchema.upload_id];
  const errorRows = outputSchema.error_count || 0;
  const importableRows = Math.max(0, inputSchema.total_rows - errorRows);

  return {
    ...readyToImport,
    upload,
    inputSchema,
    importableRows,
    errorRows,
    outputSchema
  };
};

// const mapDispatchToProps = (dispatch) => ({
//   openModal: () => dispatch(openHelpModal()),
//   closeModal: () => dispatch(closeHelpModal()),
//   nextModal: () => dispatch(nextHelpItem()),
//   previousModal: () => dispatch(previousHelpItem())
// });


export default connect(mapStateToProps)(ReadyToImport);
