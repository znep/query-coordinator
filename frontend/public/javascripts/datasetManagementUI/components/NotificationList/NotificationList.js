import PropTypes from 'prop-types';
import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import UploadNotification from 'containers/UploadNotificationContainer';
import AttachmentNotification from 'components/AttachmentNotification/AttachmentNotification';

import styles from './NotificationList.scss';

// This component is responsible for choosing the kind of notification to display
// (e.g. source, socket error, etc.) and sliding all the notifications into view.
// Displaying status (success, error, inProgress) and all the logic needed to figure
// that status out are handled farther down the component tree.
const NotificationList = ({ notifications }) => {
  const items = notifications.map((notification, i) => {
    let item;

    switch (notification.kind) {
      case 'source':
        item = <UploadNotification notification={notification} key={i} />;
        break;
      case 'attachment':
        item = (<AttachmentNotification
          filename={notification.subject}
          percent={notification.percent}
          status={notification.status}
          error={notification.error}
          key={i} />);
        break;
      default:
        item = null;
    }

    if (!item) {
      return null;
    }

    return (
      <CSSTransition
        key={i}
        classNames={{
          enter: styles.enter,
          enterActive: styles.enterActive,
          exit: styles.exit,
          exitActive: styles.exitActive
        }}
        timeout={{ enter: 500, exit: 500 }}>
        {item}
      </CSSTransition>
    );
  });

  return (
    <div className={styles.list}>
      <TransitionGroup>
        {items}
      </TransitionGroup>
    </div>
  );
};

NotificationList.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object)
};

export default NotificationList;
