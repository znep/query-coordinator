import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { STATUS_CALL_IN_PROGRESS, STATUS_CALL_SUCCEEDED } from 'lib/apiCallStatus';
import DetailedNotification from 'components/DetailedNotification';
import Notification from 'components/Notification';
import styles from 'styles/Notifications/UploadNotification.scss';

const callStatusToNotificationStatus = callStatus => {
  switch (callStatus) {
    case STATUS_CALL_IN_PROGRESS:
      return 'inProgress';
    case STATUS_CALL_SUCCEEDED:
      return 'success';
    default:
      return 'error';
  }
};

// This component is called by the NotificationList component. It's main purpose
// is to translate upload-specific logic into props that the generic Notification
// component can understand. It is also responsible for choosing whether to render
// a detailed or a basic notification.
const UploadNotification = ({ upload, callStatus, showDetails }) => {
  let contents;
  let notificationStatus = callStatusToNotificationStatus(callStatus);

  switch (callStatus) {
    case STATUS_CALL_IN_PROGRESS:
    case STATUS_CALL_SUCCEEDED:
      contents = (
        <span className={styles.message}>
          {I18n.progress_items.uploading}
          <span className={styles.subMessage}>{upload.filename}</span>
        </span>
      );
      break;
    default:
      contents = <span className={styles.message}>{I18n.progress_items.upload_failed}</span>;
  }

  if (showDetails) {
    return (
      <DetailedNotification
        status={notificationStatus}
        progressBar
        percentCompleted={upload.percentCompleted}>
        {contents}
      </DetailedNotification>
    );
  } else {
    return (
      <Notification status={notificationStatus} progressBar percentCompleted={upload.percentCompleted}>
        {contents}
      </Notification>
    );
  }
};

UploadNotification.propTypes = {
  upload: PropTypes.shape({
    filname: PropTypes.string.isRequired
  }),
  callStatus: PropTypes.string.isRequired,
  showDetails: PropTypes.bool
};

const mapStateToProps = ({ entities, ui }, { notification }) => ({
  upload: entities.uploads[notification.uploadId],
  callStatus: ui.apiCalls[notification.callId].status,
  showDetails: notification.showDetails
});

export default connect(mapStateToProps)(UploadNotification);
