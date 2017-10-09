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

    const notifications = userNotifications.filter((notification) => {
      return _.isEqual(filterNotificationsBy, 'all') || _.isEqual(notification.type, filterNotificationsBy);
    });

    if (_.isEmpty(notifications)) {
      return (
        <div styleName="no-notifications-message"
             className="no-user-notifications-message">
          <h3>{I18n.t('shared_site_chrome_notifications.no_filtered_notifications')}</h3>
        </div>
      );
    } else {
      return notifications.map(notification =>
        <UserNotification
          key={notification.id}
          id={notification.id}
          is_read={notification.read}
          activity_type={notification.activity_type}
          created_at={notification.created_at}
          type={notification.type}
          title={notification.title}
          message_body={notification.message_body}
          link={notification.link}
          user_name={notification.user_name}
          user_profile_link={notification.user_profile_link}
          onClearUserNotification={onClearUserNotification}
          onToggleReadUserNotification={onToggleReadUserNotification} />
      );
    }
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
