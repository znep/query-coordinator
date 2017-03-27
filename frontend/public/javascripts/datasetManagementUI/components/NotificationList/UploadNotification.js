import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ProgressBar from '../ProgressBar';
import UploadNotificationError from './UploadNotificationError';
import { STATUS_SAVED, STATUS_UPDATE_FAILED } from '../../lib/database/statuses';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/NotificationList/UploadNotification.scss';

// TODO: abstract notificatin container below into its own component
function UploadNotification({ upload, notification, dispatch }) {
  if (upload.__status__.type === STATUS_UPDATE_FAILED || upload.failed_at) {
    return <UploadNotificationError upload={upload} notification={notification} dispatch={dispatch} />;
  } else if (upload.__status__.type === STATUS_SAVED) {
    return (
      <div className={`${styles.notification} ${styles.successful}`}>
        <span className={styles.message}>{I18n.progress_items.uploading}</span>
        <span className={styles.subMessage}>{upload.filename}</span>
        <span className={styles.successMessage}>
          {I18n.progress_items.success}&nbsp;
          <SocrataIcon name="check" />
        </span>
        <div className={styles.progressBarContainer}>
          <ProgressBar percent={100} type="success" className={styles.progressBar} />
        </div>
      </div>
    );
  } else {
    return (
      <div className={`${styles.notification} ${styles.inProgress}`}>
        <span className={styles.message}>{I18n.progress_items.uploading}</span>
        <span className={styles.subMessage}>{upload.filename}</span>
        <span className={styles.percentCompleted}>{Math.round(upload.__status__.percentCompleted)}%</span>
        <div className={styles.progressBarContainer}>
          <ProgressBar
            percent={upload.__status__.percentCompleted}
            type="inProgress"
            className={styles.progressBar} />
        </div>
      </div>
    );
  }
}

UploadNotification.propTypes = {
  upload: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  notification: PropTypes.object
};

export default connect()(UploadNotification);
