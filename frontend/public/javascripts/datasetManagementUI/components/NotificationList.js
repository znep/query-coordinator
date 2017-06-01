import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import Notification from './NotificationList/Notification';
import { UPLOAD_NOTIFICATION, UPSERT_JOB_NOTIFICATION } from '../lib/notifications';
import styles from 'styles/NotificationList.scss';

function NotificationList({ notifications }) {
  const idForNotification = notification => {
    switch (notification.type) {
      case UPLOAD_NOTIFICATION:
        return notification.uploadId;

      case UPSERT_JOB_NOTIFICATION:
        return notification.upsertJobId;

      default:
        return null;
    }
  };

  const items = notifications.map(notification => (
    <Notification
      key={`${notification.type}-${idForNotification(notification)}`}
      notification={notification} />
  ));

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
}

NotificationList.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object)
};

function mapStateToProps(state) {
  return {
    notifications: state.ui.notifications
  };
}

export default connect(mapStateToProps)(NotificationList);
