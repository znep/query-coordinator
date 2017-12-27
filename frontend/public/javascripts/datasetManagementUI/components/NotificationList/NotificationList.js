import PropTypes from 'prop-types';
import React from 'react';
import { CSSTransitionGroup } from 'react-transition-group';
import UploadNotification from 'containers/UploadNotificationContainer';
import AttachmentNotification from 'components/AttachmentNotification/AttachmentNotification';
import Notification from 'containers/NotificationContainer';
import styles from './NotificationList.module.scss';

// This component is responsible for choosing the kind of notification to display
// (e.g. source, socket error, etc.) and sliding all the notifications into view.
// Displaying status (success, error, inProgress) and all the logic needed to figure
// that status out are handled farther down the component tree.
const NotificationList = ({ notifications }) => {
  const items = notifications.map((notification, i) => {
    switch (notification.kind) {
      case 'source':
        return <UploadNotification notification={notification} key={i} />;
      case 'attachment':
        return (<AttachmentNotification
          filename={notification.subject}
          percent={notification.percent}
          status={notification.status}
          error={notification.error}
          key={i} />);
      case 'error':
        return (<Notification
          key={i}
          status="error"
          id={notification.id}
          message={I18n.notifications.error}>
          {notification.subject}
        </Notification>);
      default:
        return null;
    }
  });

  return (
    <div className={styles.list}>
      <CSSTransitionGroup
        transitionName={{
          enter: styles.enter,
          enterActive: styles.enterActive,
          leave: styles.leave,
          leaveActive: styles.leaveActive
        }}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500}>
        {items}
      </CSSTransitionGroup>
    </div>
  );
};

NotificationList.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object)
};

export default NotificationList;
