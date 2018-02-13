import _ from 'lodash';
import cssModules from 'react-css-modules';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import connectLocalization from 'common/i18n/components/connectLocalization';

import styles from './transient-notifications.module.scss';
import UserNotification from './UserNotification';

class TransientNotifications extends Component {
  render() {
    const {
      onClearUserNotification,
      onToggleReadUserNotification,
      moveTransientNotificationIntoPanel,
      transientNotifications
    } = this.props;

    return (
      <div>
        <ul className="transient-notifications-list" styleName="transient-notifications-list">
          {transientNotifications.map((notification) =>
            <UserNotification
              isTransientNotification
              key={notification.id}
              moveTransientNotificationIntoPanel={moveTransientNotificationIntoPanel}
              notification={notification}
              onClearUserNotification={onClearUserNotification}
              onToggleReadUserNotification={onToggleReadUserNotification} />
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
