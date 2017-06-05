import React, { PropTypes } from 'react';
import ProgressBar from 'components/ProgressBar';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Notifications/Notification.scss';

const Notification = ({ status, progressBar, percentCompleted, customStatusMessage, children }) => {
  let classNames = [styles.notification];
  let statusIcon;
  let statusMessage;

  switch (status) {
    case 'success':
      classNames = [...classNames, styles.success].join(' ');
      statusIcon = <SocrataIcon name="check" className={styles.successIcon} />;
      statusMessage = <span className={styles.success}>{I18n.progress_items.success}</span>;
      break;
    case 'error':
      classNames = [...classNames, styles.error].join(' ');
      statusIcon = <SocrataIcon name="warning" className={styles.errorIcon} />;
      statusMessage = <span className={styles.error}>{I18n.progress_items.error}</span>;
      break;
    case 'inProgress':
      classNames = [...classNames, styles.inProgress].join(' ');
      statusIcon = <span className={styles.progressIcon}>Math.round(upload.percentCompleted) + '%'</span>;
      break;
    default:
      classNames = classNames.join(' ');
  }

  return (
    <div className={classNames}>
      <div className={styles.cf}>
        <span className={styles.messageArea}>{children}</span>
        <span className={styles.statusArea}>
          {customStatusMessage || statusMessage}
          {statusIcon}
        </span>
      </div>
      {progressBar &&
        <div className={styles.progressBarContainer}>
          <ProgressBar percent={percentCompleted || 0} type={status} className={styles.progressBar} />
        </div>}
    </div>
  );
};

Notification.propTypes = {
  status: PropTypes.string.isRequired,
  progressBar: PropTypes.bool,
  percentCompleted: PropTypes.number,
  customStatusMessage: PropTypes.object,
  children: PropTypes.object
};

export default Notification;
