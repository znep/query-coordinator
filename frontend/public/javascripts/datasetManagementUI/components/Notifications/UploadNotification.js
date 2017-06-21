import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { STATUS_CALL_IN_PROGRESS, STATUS_CALL_SUCCEEDED } from 'lib/apiCallStatus';
import Notification from 'components/Notifications/Notification';
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

const errorMessage = upload => {
  const badConnectionBodyDescription = {
    __html: I18n.progress_items.connection_error_body_description.format(
      `<span class="filename">${upload.filename}</span>`
    )
  };

  const badConnection = (
    <div className={styles.msgContainer}>
      <h6>{I18n.progress_items.connection_error_title}</h6>
      <p dangerouslySetInnerHTML={badConnectionBodyDescription} />
      <p>{I18n.progress_items.connection_error_body_advice}</p>
    </div>
  );

  return badConnection;
};

// This component is called by the NotificationList component. It's main purpose
// is to translate upload-specific logic into props that the generic Notification
// component can understand.
export const UploadNotification = ({ upload, callStatus, notificationId }) => {
  let message;
  let details;
  let notificationStatus = callStatusToNotificationStatus(callStatus);

  switch (callStatus) {
    case STATUS_CALL_IN_PROGRESS:
    case STATUS_CALL_SUCCEEDED:
      message = (
        <span className={styles.message}>
          {I18n.progress_items.uploading}
          <span className={styles.subMessage}>{upload.filename}</span>
        </span>
      );
      break;
    default:
      message = <span className={styles.message}>{I18n.progress_items.upload_failed}</span>;
      details = errorMessage(upload);
  }

  return (
    <Notification
      status={notificationStatus}
      id={notificationId}
      progressBar
      percentCompleted={upload.percentCompleted}
      message={message}>
      {details}
    </Notification>
  );
};

UploadNotification.propTypes = {
  upload: PropTypes.shape({
    filname: PropTypes.string
  }),
  callStatus: PropTypes.string.isRequired,
  showDetails: PropTypes.bool,
  notificationId: PropTypes.string
};

const mapStateToProps = ({ entities, ui }, { notification }) => ({
  upload: entities.uploads[notification.uploadId],
  notificationId: notification.id,
  callStatus: ui.apiCalls[notification.callId].status
});

export default connect(mapStateToProps)(UploadNotification);
