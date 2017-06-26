/* eslint react/jsx-indent: 0 */
import React, { PropTypes } from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent } from 'common/components';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import * as Links from 'links';
import * as Selectors from 'selectors';
import UploadBreadcrumbs from 'components/Uploads/UploadBreadcrumbs';
import DragDropUpload from 'components/Uploads/DragDropUpload';
import UploadSidebar from 'components/Uploads/UploadSidebar';
import FlashMessage from 'components/FlashMessage/FlashMessage';
import styles from 'styles/ShowUpload.scss';

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
          : <div className={styles.uploadContainer}>
              <DragDropUpload />
              <UploadSidebar />
            </div>}
      </ModalContent>
    </Modal>
  </div>;

export const mapStateToProps = ({ entities, ui }) => {
  // selector returns undefined if there are no uploads
  const upload = Selectors.latestUpload(entities);
  let apiCall = [];

  if (upload && upload.id) {
    const { id: uploadId } = upload;
    const apiCallList = Object.keys(ui.apiCalls).map(callId => ui.apiCalls[callId]);

    apiCall = apiCallList.filter(
      call =>
        call.operation === 'UPLOAD_FILE' &&
        call.status === STATUS_CALL_IN_PROGRESS &&
        call.params &&
        call.params.id === uploadId
    );
  }

  // Include upload in the definition of inProgress because if there is no upload,
  // we don't want to show the spinner, we want to show the actual component so the
  // user can upload something
  // TODO: maybe tweak this in the future. For really small files, the upload finishes
  // before polling for OS does, so the uploads page shows (instead of the spinner)
  // for a split second before transitioning to ShowOutputSchema page
  return {
    inProgress: !!upload && !!apiCall.length
  };
};

ShowUpload.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  goHome: PropTypes.func.isRequired
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  goHome: () => dispatch(push(Links.home(ownProps.location)))
});

export default connect(mapStateToProps, mapDispatchToProps)(ShowUpload);
