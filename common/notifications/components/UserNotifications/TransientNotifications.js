import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import UserNotification from './UserNotification';
import styles from './transient-notifications.scss';

class TransientNotifications extends Component {
  renderTransientNotifications() {
    const {
      transientNotifications,
      onClearUserNotification,
      onToggleReadUserNotification,
      moveTransientNotificationIntoPanel
    } = this.props;
    const isTransientNotification = true;

    if (!_.isEmpty(transientNotifications)) {
      return transientNotifications.map((notification) =>
        <UserNotification
          key={notification.id}
          id={notification.id}
          isRead={notification.read}
          isTransientNotification={isTransientNotification}
          activityType={notification.activityType}
          createdAt={notification.createdAt}
          type={notification.type}
          activityUniqueKey={notification.activityUniqueKey}
          messageBody={notification.messageBody}
          link={notification.link}
          userName={notification.userName}
          userProfileLink={notification.userProfileLink}
          onClearUserNotification={onClearUserNotification}
          onToggleReadUserNotification={onToggleReadUserNotification}
          moveTransientNotificationIntoPanel={moveTransientNotificationIntoPanel} />
      );
    }
  }

  render() {
    return (
      <div>
        <ul
          styleName="transient-notifications-list"
          className="transient-notifications-list">
          {this.renderTransientNotifications()}
        </ul>
      </div>
    );
  }
}

TransientNotifications.propTypes = {
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired,
  moveTransientNotificationIntoPanel: PropTypes.func.isRequired
};

TransientNotifications.defaultProps = {
  transientNotifications: null
};

export default connectLocalization(cssModules(TransientNotifications, styles, { allowMultiple: true }));
