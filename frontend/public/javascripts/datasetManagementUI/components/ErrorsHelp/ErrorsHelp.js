/* eslint react/jsx-indent: 0 */
import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { ModalHeader, ModalContent, ModalFooter } from 'common/components';
import classNames from 'classnames';
import styles from 'styles/Modals/ErrorsHelp.scss';

const SubI18n = I18n.show_output_schema.ready_to_import;

const makeErrorString = (start, end, errorRowCount) =>
  <span>
    {SubI18n.help_modal[start]}
    <span className={styles.errorCount}>{` ${errorRowCount} `}</span>
    {SubI18n.help_modal[end]}
  </span>;

const WhyWontTheyImport = () =>
  <div className={styles.help}>
    <p>
      {SubI18n.help_modal.we_love_your_data}&nbsp;
      <span className={styles.typesOfErrors}>{SubI18n.help_modal.two_types_of_errors}</span>
    </p>

    <div className={styles.kinds}>
      <div className={styles.typeErrors}>
        <h6>
          {SubI18n.help_modal.type_errors}
        </h6>
        <img
          alt={SubI18n.help_modal.type_errors}
          className={styles.helpVis1a}
          src="/images/datasetManagementUI/help-visual-1a.png" />
        <p className={styles.caption}>
          {SubI18n.help_modal.type_error_blurb}
        </p>
      </div>
      <div className={styles.rowErrors}>
        <h6>
          {SubI18n.help_modal.row_errors}
        </h6>
        <img
          alt={SubI18n.help_modal.row_errors}
          className={styles.helpVis1b}
          src="/images/datasetManagementUI/help-visual-1b.png" />
        <p className={styles.caption}>
          {SubI18n.help_modal.row_error_blurb}
        </p>
      </div>
    </div>
  </div>;

const WhatCanIDoAboutIt = ({ errorRowCount }) =>
  <div className={styles.help}>
    <p>
      {SubI18n.help_modal.error_file_blurb}
    </p>
    <h6>
      {makeErrorString('you_can_download_start', 'you_can_download_end', errorRowCount)}
    </h6>
    <img
      alt={SubI18n.help_modal.error_file_blurb}
      className={styles.helpVis2}
      src="/images/datasetManagementUI/help-visual-2.png" />
    <p className={styles.caption}>
      {SubI18n.help_modal.error_file_sub_blurb}
    </p>
  </div>;

WhatCanIDoAboutIt.propTypes = {
  errorRowCount: PropTypes.number.isRequired
};

const HowToGetRowsBackInDataset = () =>
  <div className={styles.help}>
    <p>
      {SubI18n.help_modal.get_rows_into_dataset_blurb}
    </p>
    <h6>
      {SubI18n.help_modal.clean_data_blurb}
    </h6>
    <img
      alt={SubI18n.help_modal.get_rows_into_dataset_blurb}
      className={styles.helpVis3}
      src="/images/datasetManagementUI/help-visual-3.png" />
    <p className={styles.caption}>
      {SubI18n.help_modal.clean_data_sub_blurb}
    </p>
  </div>;

const pages = [WhatCanIDoAboutIt, WhyWontTheyImport, HowToGetRowsBackInDataset];

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

const Dots = ({ currentPageIdx, numOfTotalPages, setPage }) => {
  let dots = [];

  for (let idx = 0; idx < numOfTotalPages; idx += 1) {
    const dot = (
      <div
        key={idx}
        onClick={() => setPage(idx)}
        className={classNames(styles.dot, { [styles.dotSelected]: idx === currentPageIdx })}>
        &#x25CF;
      </div>
    );

    dots.push(dot);
  }

  return (
    <span>
      {dots}
    </span>
  );
};

Dots.propTypes = {
  currentPageIdx: PropTypes.number.isRequired,
  numOfTotalPages: PropTypes.number.isRequired,
  setPage: PropTypes.func.isRequired
};

class ErrorsHelp extends Component {
  constructor() {
    super();

    this.state = {
      modalPage: 0
    };

    _.bindAll(this, ['nextPage', 'prevPage', 'setPage']);
  }

  setPage(pageNumber) {
    this.setState({
      modalPage: pageNumber
    });
  }

  nextPage() {
    this.setPage(this.state.modalPage + 1);
  }

  prevPage() {
    this.setPage(this.state.modalPage - 1);
  }

  render() {
    const { onDismiss, errorRowCount } = this.props;
    const { modalPage } = this.state;

    const headerProps = {
      title: getHeaderTitle(modalPage, errorRowCount),
      className: styles.header,
      onDismiss: onDismiss
    };

    const content = getContent(modalPage, errorRowCount);

    const buttonText = modalPage === pages.length - 1 ? SubI18n.help_modal.done : SubI18n.help_modal.next;

    const buttonHandler = modalPage === pages.length - 1 ? onDismiss : this.nextPage;

    const previousButton =
      modalPage > 0
        ? <button onClick={this.prevPage} className={styles.previousButton}>
            {SubI18n.help_modal.previous}
          </button>
        : null;

    return (
      <div>
        <ModalHeader {...headerProps} />
        <ModalContent className={styles.content}>
          {content}
        </ModalContent>
        <ModalFooter className={styles.footer}>
          <Dots currentPageIdx={modalPage} numOfTotalPages={pages.length} setPage={this.setPage} />
          <div className={styles.buttonContainer}>
            {previousButton}
            <button onClick={buttonHandler} className={styles.nextButton}>
              {buttonText}
            </button>
          </div>
        </ModalFooter>
      </div>
    );
  }
}

ErrorsHelp.propTypes = {
  errorRowCount: PropTypes.number.isRequired,
  onDismiss: PropTypes.func
};

export default ErrorsHelp;
