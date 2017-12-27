import PropTypes from 'prop-types';
import React from 'react';
import Notification from 'containers/NotificationContainer';
import styles from '../UploadNotification/UploadNotification.module.scss';

// This component is called by the NotificationList component. Its main purpose
// is to translate attachment-specific logic into props that the generic Notification
// component can understand.
const AttachmentNotification = ({ percent, filename, status, error }) => {
  let message;

  if (error) {
    message = (<span className={styles.message}>
      {error.message}
    </span>);
  } else {
    message = (<span className={styles.message}>
      {I18n.notifications.uploading_attachment}
      {' '}
      <span className={styles.subMessage}>
        {filename}
      </span>
    </span>);
  }


  return (
    <Notification
      status={status}
      id={0}
      progressBar
      percentCompleted={percent}
      isInfinite={false}
      message={message} />
  );
};

AttachmentNotification.propTypes = {
  percent: PropTypes.number.isRequired,
  filename: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  error: PropTypes.object
};

export default AttachmentNotification;
