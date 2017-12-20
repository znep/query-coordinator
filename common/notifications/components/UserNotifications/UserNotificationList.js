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
        <div
          styleName="no-notifications-message"
          className="no-user-notifications-message">
          <h3>{I18n.t('shared_site_chrome_notifications.no_filtered_notifications')}</h3>
        </div>
      );
    }

    return notifications.map((notification) =>
      <UserNotification
        key={notification.id}
        notification={notification}
        isTransientNotification={false}
        onClearUserNotification={onClearUserNotification}
        onToggleReadUserNotification={onToggleReadUserNotification} />
    );
  }

  renderLoadMoreUserNotificationLink() {
    const { hasMoreNotifications } = this.props;

    if (hasMoreNotifications) {
      const { onLoadMoreUserNotifications, I18n } = this.props;

      return (
        <div
          className="load-more-user-notifications"
          styleName="load-more-user-notifications-link-wrapper">
          <button styleName="load-more-user-notifications-link" onClick={onLoadMoreUserNotifications}>
            {I18n.t('load_more_items', { scope: 'shared_site_chrome_notifications' })}
          </button>
        </div>
      );
    }
  }

  renderSeeMoreNotificationsLink() {
    const { hasEnqueuedUserNotifications } = this.props;

    if (hasEnqueuedUserNotifications) {
      const { onSeeNewUserNotifications, I18n } = this.props;

      return (
        <div
          className="see-new-user-notifications"
          styleName="see-new-user-notifications-link-wrapper">
          <button styleName="see-new-user-notifications-link" onClick={onSeeNewUserNotifications}>
            {I18n.t('see_new_notifications', { scope: 'shared_site_chrome_notifications' })}
          </button>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderSeeMoreNotificationsLink()}

        <ul styleName="socrata-user-notification-list">
          {this.renderUserNotifications()}
        </ul>

        {this.renderLoadMoreUserNotificationLink()}
      </div>
    );
  }
}

UserNotificationList.propTypes = {
  filterNotificationsBy: PropTypes.string.isRequired,
  hasMoreNotifications: PropTypes.bool.isRequired,
  hasEnqueuedUserNotifications: PropTypes.bool.isRequired,
  onClearUserNotification: PropTypes.func.isRequired,
  onLoadMoreUserNotifications: PropTypes.func.isRequired,
  onSeeNewUserNotifications: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired
};

UserNotificationList.defaultProps = {
  userNotifications: null
};

export default connectLocalization(cssModules(UserNotificationList, styles, { allowMultiple: true }));
