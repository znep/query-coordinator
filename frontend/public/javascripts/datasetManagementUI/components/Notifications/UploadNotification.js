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

const errorMessage = source => {
  const badConnectionBodyDescription = {
    __html: I18n.progress_items.connection_error_body_description.format(
      `<span class="filename">${source.filename}</span>`
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

function getFilename(source) {
  if (source.source_type.type === 'upload') return source.source_type.filename;
  return 'Unknown';
}

// This component is called by the NotificationList component. It's main purpose
// is to translate source-specific logic into props that the generic Notification
// component can understand.
export const UploadNotification = ({ source, callStatus, notificationId }) => {
  let message;
  let details;
  let notificationStatus = callStatusToNotificationStatus(callStatus);

  switch (callStatus) {
    case STATUS_CALL_IN_PROGRESS:
    case STATUS_CALL_SUCCEEDED:
      message = (
        <span className={styles.message}>
          {I18n.progress_items.uploading}
          <span className={styles.subMessage}>{getFilename(source)}</span>
        </span>
      );
      break;
    default:
      message = <span className={styles.message}>{I18n.progress_items.source_failed}</span>;
      details = errorMessage(source);
  }

  return (
    <Notification
      status={notificationStatus}
      id={notificationId}
      progressBar
      percentCompleted={source.percentCompleted}
      message={message}>
      {details}
    </Notification>
  );
};

UploadNotification.propTypes = {
  source: PropTypes.shape({
    source_type: PropTypes.shape({})
  }),
  callStatus: PropTypes.string.isRequired,
  showDetails: PropTypes.bool,
  notificationId: PropTypes.string
};

const mapStateToProps = ({ entities, ui }, { notification }) => ({
  source: entities.sources[notification.sourceId],
  notificationId: notification.id,
  callStatus: ui.apiCalls[notification.callId].status
});

export default connect(mapStateToProps)(UploadNotification);
