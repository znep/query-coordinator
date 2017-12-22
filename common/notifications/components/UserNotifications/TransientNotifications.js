import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import UserNotification from './UserNotification';
import styles from './transient-notifications.scss';

class TransientNotifications extends Component {
  render() {
    const {
      transientNotifications,
      onClearUserNotification,
      onToggleReadUserNotification,
      moveTransientNotificationIntoPanel
    } = this.props;

    return (
      <div>
        <ul
          styleName="transient-notifications-list"
          className="transient-notifications-list">
          {transientNotifications.map((notification) =>
            <UserNotification
              key={notification.id}
              notification={notification}
              isTransientNotification
              onClearUserNotification={onClearUserNotification}
              onToggleReadUserNotification={onToggleReadUserNotification}
              moveTransientNotificationIntoPanel={moveTransientNotificationIntoPanel} />
          )}
        </ul>
      </div>
    );
  }
}

TransientNotifications.propTypes = {
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired,
  moveTransientNotificationIntoPanel: PropTypes.func.isRequired,
  transientNotifications: PropTypes.array.isRequired
};

export default connectLocalization(cssModules(TransientNotifications, styles, { allowMultiple: true }));
