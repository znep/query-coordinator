import React, { PropTypes } from 'react';
import ProgressBar from 'components/ProgressBar';
import styles from 'styles/NotificationList/UploadNotification.scss';

const Notification = ({ kind, children }) => {
  let classNames = [styles.notification];
  let percent;
  let progressBarType = kind;

  switch (kind) {
    case 'error':
      classNames = [...classNames, styles.error].join(' ');

    case 'success':
      classNames = [...classNames, styles.success].join(' ');
      percent = 100;

    case 'inProgress':
      classNames = [...classNames, styles.inProgress].join(' ');
      percent = Math.round(upload.percentCompleted);

    default:
      classNames = classNames.join(' ');
  }

  return (
    <div className={classNames}>
      {children}
      {percentCompleted &&
        <div className={styles.progressBarContainer}>
          <ProgressBar percent={percent} type={progressBarType} className={styles.progressBar} />
        </div>}
    </div>
  );
};
