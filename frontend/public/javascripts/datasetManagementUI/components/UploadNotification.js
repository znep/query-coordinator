import _ from 'lodash';
import React, { PropTypes } from 'react';
import { STATUS_CALL_IN_PROGRESS, STATUS_CALL_SUCCEEDED } from 'lib/apiCallStatus';
import Notification from 'components/Notifications/NotificationContainer';
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

const errorMessage = (apiCall, source) => {
  if (_.get(apiCall, 'error.reason', null)) {
    return (
      <div className={styles.msgContainer}>
        {apiCall.error.reason}
      </div>
    );
  }

  const badConnectionBodyDescription = {
    __html: I18n.notifications.connection_error_body_description.format(
      `<span class="filename">${getFilename(source)}</span>`
    )
  };

  const badConnection = (
    <div className={styles.msgContainer}>
      <h6>
        {I18n.notifications.connection_error_title}
      </h6>
      <p dangerouslySetInnerHTML={badConnectionBodyDescription} />
      <p>
        {I18n.notifications.connection_error_body_advice}
      </p>
    </div>
  );

  return badConnection;
};

function getFilename(source) {
  if (source.source_type.type === 'upload') return source.source_type.filename;
  return 'Unknown';
}

// This component is called by the NotificationList component. Its main purpose
// is to translate source-specific logic into props that the generic Notification
// component can understand.
const UploadNotification = ({ source, apiCall, notificationId }) => {
  let message;
  let details;
  const callStatus = apiCall.status;
  let notificationStatus = callStatusToNotificationStatus(callStatus);

  switch (callStatus) {
    case STATUS_CALL_IN_PROGRESS:
    case STATUS_CALL_SUCCEEDED:
      message = (
        <span className={styles.message}>
          {I18n.notifications.uploading}
          <span className={styles.subMessage}>
            {getFilename(source)}
          </span>
        </span>
      );
      break;
    default:
      message = (
        <span className={styles.message}>
          {I18n.notifications.upload_failed}
        </span>
      );
      details = errorMessage(apiCall, source);
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
  apiCall: PropTypes.shape({
    status: PropTypes.string.isRequired,
    error: PropTypes.shape({
      reason: PropTypes.string.isRequired
    })
  }).isRequired,
  showDetails: PropTypes.bool,
  notificationId: PropTypes.string
};

export default UploadNotification;
