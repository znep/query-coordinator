import React, { PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import UploadNotification from 'containers/UploadNotificationContainer';
import styles from './NotificationList.scss';

// This component is responsible for choosing the kind of notification to display
// (e.g. source, socket error, etc.) and sliding all the notifications into view.
// Displaying status (success, error, inProgress) and all the logic needed to figure
// that status out are handled farther down the component tree.
const NotificationList = ({ notifications }) => {
  const items = notifications.map(notification => {
    switch (notification.kind) {
      case 'upload':
        return <UploadNotification notification={notification} key={notification.id} />;
      default:
        return null;
    }
  });

  return (
    <div className={styles.list}>
      <ReactCSSTransitionGroup
        transitionName={{
          enter: styles.enter,
          enterActive: styles.enterActive,
          leave: styles.leave,
          leaveActive: styles.leaveActive
        }}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500}>
        {items}
      </ReactCSSTransitionGroup>
    </div>
  );
};

NotificationList.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object)
};

export default NotificationList;
