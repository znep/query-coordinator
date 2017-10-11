import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import UserNotification from './UserNotification';
import styles from './user-notification-list.scss';

class UserNotificationList extends Component {
  renderUserNotifications() {
    const {
      userNotifications,
      filterNotificationsBy,
      onClearUserNotification,
      onToggleReadUserNotification,
      I18n
    } = this.props;

    const notifications = userNotifications.filter((notification) => (
      _.isEqual(filterNotificationsBy, 'all') || _.isEqual(notification.type, filterNotificationsBy)
    ));

    if (_.isEmpty(notifications)) {
      return (
        <div styleName="no-notifications-message"
             className="no-user-notifications-message">
          <h3>{I18n.t('shared_site_chrome_notifications.no_filtered_notifications')}</h3>
        </div>
      );
    }

    return notifications.map((notification) =>
      <UserNotification
        key={notification.id}
        id={notification.id}
        isRead={notification.read}
        activityType={notification.activityType}
        createdAt={notification.createdAt}
        type={notification.type}
        title={notification.title}
        messageBody={notification.messageBody}
        link={notification.link}
        userName={notification.userName}
        userProfileLink={notification.userProfileLink}
        onClearUserNotification={onClearUserNotification}
        onToggleReadUserNotification={onToggleReadUserNotification} />
    );
  }

  render() {
    return (
      <ul styleName="socrata-user-notification-list">
        {this.renderUserNotifications()}
      </ul>
    );
  }
}

UserNotificationList.propTypes = {
  filterNotificationsBy: PropTypes.string.isRequired,
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired
};

UserNotificationList.defaultProps = {
  userNotifications: null
};

export default connectLocalization(cssModules(UserNotificationList, styles, { allowMultiple: true }));
