import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import UserNotification from './UserNotification';
import { STATUS_ACTIVITY_TYPES } from 'common/notifications/constants';
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

    const filterAllTabText = I18n.t('shared_site_chrome_notifications.filter_all_notifications_tab_text');
    const notifications = _.isEmpty(userNotifications) ? [] : userNotifications.filter(notification => {
      return filterNotificationsBy === filterAllTabText ||
        (filterNotificationsBy === 'alert' ?
          !_.includes(STATUS_ACTIVITY_TYPES, notification.activity.activity_type) :
          _.includes(STATUS_ACTIVITY_TYPES, notification.activity.activity_type));
    }) || {};

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
          is_read={_.isUndefined(notification.read) ? false : notification.read}
          activity_type={_.get(notification, 'activity.activity_type', '')}
          dataset_name={_.get(notification, 'activity.dataset_name', '')}
          dataset_uid={_.get(notification, 'activity.dataset_uid', '')}
          created_at={_.get(notification, 'activity.created_at', '')}
          acting_user_name={_.get(notification, 'activity.acting_user_name', '')}
          acting_user_id={_.get(notification, 'activity.acting_user_id', '')}
          domain_cname={_.get(notification, 'activity.domain_cname', '')}
          message_body={_.get(JSON.parse(_.get(notification, 'activity.details', '')), 'summary', '')}
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
