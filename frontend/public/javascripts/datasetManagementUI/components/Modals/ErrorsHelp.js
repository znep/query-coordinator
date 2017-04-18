import React, { PropTypes, Component } from 'react';
import { ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { connect } from 'react-redux';
import _ from 'lodash';
import { hideModal } from 'actions/modal';
import styles from 'styles/Modals/ErrorsHelp.scss';

const SubI18n = I18n.show_output_schema.ready_to_import;


// TODO: refactor using setdangerousinnerHTML?
const makeErrorString = (start, end, errorRowCount) =>
  <span>
    {SubI18n.help_modal[start]}
    <span className={styles.errorCount}>{` ${errorRowCount} `}</span>
    {SubI18n.help_modal[end]}
  </span>;

const getHeaderTitle = (idx, errorRowCount) => {
  switch (idx) {
    case 0:
      return makeErrorString('why_wont_start', 'why_wont_end', errorRowCount);
    case 1:
      return SubI18n.help_modal.error_file;
    case 2:
      return makeErrorString('clean_data_start', 'clean_data_end', errorRowCount);
    default:
      return '';
  }
};

const WhyWontTheyImport = () =>
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
  </div>;

const WhatCanIDoAboutIt = ({ errorRowCount }) =>
  <div className="help">
    <p>{SubI18n.help_modal.error_file_blurb}</p>
    <h6>{makeErrorString('you_can_download_start', 'you_can_download_end', errorRowCount)}</h6>
    <img
      alt="{SubI18n.help_modal.error_file_blurb}"
      className={styles.helpVis2}
      src="/images/datasetManagementUI/help-visual-2.png" />
    <p className={styles.caption}>{SubI18n.help_modal.error_file_sub_blurb}</p>
  </div>;

WhatCanIDoAboutIt.propTypes = {
  errorRowCount: PropTypes.number.isRequired
};

const HowToGetRowsBackInDataset = () =>
  <div className="help">
    <p>{SubI18n.help_modal.get_rows_into_dataset_blurb}</p>
    <h6>{SubI18n.help_modal.clean_data_blurb}</h6>
    <img
      alt="{SubI18n.help_modal.get_rows_into_dataset_blurb}"
      className={styles.helpVis3}
      src="/images/datasetManagementUI/help-visual-3.png" />
    <p className={styles.caption}>{SubI18n.help_modal.clean_data_sub_blurb}</p>
  </div>;

const getContent = (idx, errorRowCount) => {
  switch (idx) {
    case 0:
      return <WhyWontTheyImport />;
    case 1:
      return <WhatCanIDoAboutIt errorRowCount={errorRowCount} />;
    case 2:
      return <HowToGetRowsBackInDataset />;
    default:
      return null;
  }
};

class ErrorsHelp extends Component {
  constructor() {
    super();

    this.state = {
      modalPage: 0
    };

    _.bindAll(['nextPage', 'prevPage']);
  }

  nextPage() {
    this.setState({
      modalPage: this.state.modalPage + 1
    });
  }

  prevPage() {
    this.setState({
      modalPage: this.state.modalPage - 1
    });
  }

  render() {
    const { onDismiss, errorRowCount } = this.props;

    const headerProps = {
      title: getHeaderTitle(this.state.modalPage, errorRowCount),
      onDismiss: onDismiss
    };

    const content = getContent(this.state.modalPage, errorRowCount);

    const buttonText = this.state.modalPage >= 3
      ? SubI18n.help_modal.done
      : SubI18n.help_modal.next;

    const buttonHandler = this.state.modalPage >= 3
      ? onDismiss
      : () => this.nextPage();

    const previousButton = this.state.modalPage > 0 ? (
      <button
        onClick={this.prevPage()}
        className={styles.previousButton}>
        {SubI18n.help_modal.previous}
      </button>) : null;

    return (
      <div>
        <ModalHeader {...headerProps} />
        <ModalContent>
          {content}
        </ModalContent>
        <ModalFooter>
          {previousButton}
          <button
            onClick={buttonHandler}
            className={styles.nextButton}>
            {buttonText}
          </button>
        </ModalFooter>
      </div>
    );
  }
}

ErrorsHelp.propTypes = {
  errorRowCount: PropTypes.number.isRequired,
  onDismiss: PropTypes.func
};

const mapStateToProps = ({ db, routing }) => {
  const { outputSchemaId } = routing;

  return {
    errorRowCount: db.output_schemas[outputSchemaId].error_count || 0
  };
};

const mapDispatchToProps = (dispatch) => ({
  onDismiss: () => dispatch(hideModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(ErrorsHelp);
