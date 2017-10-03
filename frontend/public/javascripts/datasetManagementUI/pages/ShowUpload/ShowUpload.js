import _ from 'lodash';

/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent } from 'common/components';
import * as Links from 'links';
import * as Selectors from 'selectors';
import UploadBreadcrumbs from 'containers/UploadBreadcrumbsContainer';
import DragDropUpload from 'components/DragDropUpload/DragDropUpload';
import UploadSidebar from 'containers/UploadSidebarContainer';
import FlashMessage from 'containers/FlashMessageContainer';
import styles from './ShowUpload.scss';

export const ShowUpload = ({ inProgress, goHome }) =>
  <div className={styles.showUpload}>
    <Modal fullScreen onDismiss={goHome}>
      <ModalHeader onDismiss={goHome}>
        <UploadBreadcrumbs atShowUpload />
      </ModalHeader>
      <ModalContent className={styles.modalContent}>
        <FlashMessage />
        {inProgress
          ? <div className={styles.centeredContainer}>
              <span className={styles.spinner} />
            </div>
          : <div className={styles.sourceContainer}>
              <DragDropUpload />
              <UploadSidebar />
            </div>}
      </ModalContent>
    </Modal>
  </div>;

export const mapStateToProps = ({ entities, ui }, { params }) => {
  // selector returns undefined if there are no sources
  const source = Selectors.currentSource(entities, _.toNumber(params.revisionSeq));

  // Include source in the definition of inProgress because if there is no source,
  // we don't want to show the spinner, we want to show the actual component so the
  // user can source something
  return {
    inProgress: !!source && (!source.finished_at && !source.failed_at)
  };
};

ShowUpload.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  goHome: PropTypes.func.isRequired
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  goHome: () => browserHistory.push(Links.revisionBase(ownProps.params))
});

export default connect(mapStateToProps, mapDispatchToProps)(ShowUpload);
