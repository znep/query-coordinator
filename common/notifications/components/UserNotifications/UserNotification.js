import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import moment from 'moment';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import { SocrataIcon } from 'common/components/SocrataIcon';
import { FADE_TRANSIENT_NOTIFICATION_AFTER_MILLISECONDS } from 'common/notifications/constants';
import styles from './user-notification.module.scss';

class UserNotification extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fadeAwayTimeoutId: null
    };
  }

  componentWillMount() {
    const { isTransientNotification } = this.props;

    if (isTransientNotification) {
      const { id, moveTransientNotificationIntoPanel } = this.props;
      let { fadeAwayTimeoutId } = this.state;

      fadeAwayTimeoutId = setTimeout(() => {
        moveTransientNotificationIntoPanel(id);
      }, FADE_TRANSIENT_NOTIFICATION_AFTER_MILLISECONDS);

      this.setState({ fadeAwayTimeoutId });
    }
  }

  componentWillUnmount() {
    const { isTransientNotification } = this.props;
    let { fadeAwayTimeoutId } = this.state;

    if (isTransientNotification && !_.isNull(fadeAwayTimeoutId)) {
      clearTimeout(fadeAwayTimeoutId);
      fadeAwayTimeoutId = null;
      this.setState({ fadeAwayTimeoutId });
    }
  }

  renderAlertLabel() {
    const {
      notification,
      I18n
    } = this.props;

    if (_.isEqual(notification.type, 'alert')) {
      return <em>{I18n.t('shared_site_chrome_notifications.filter_alert_notifications_tab_text')}</em>;
    }
  }

  renderSocrataLogo() {
    const { isTransientNotification } = this.props;

    if (isTransientNotification) {
      return <SocrataIcon name="logo" className="socrata-icon-logo-color" />;
    }
  }

  renderUnreadIcon() {
    const {
      notification,
      onToggleReadUserNotification,
      I18n
    } = this.props;
    let linkTitle;

    if (notification.read) {
      linkTitle = I18n.t('shared_site_chrome_notifications.mark_as_unread');
    } else {
      linkTitle = I18n.t('shared_site_chrome_notifications.mark_as_read');
    }

    return (
      <span
        styleName="link-icon"
        className="toggle-notification-read-state"
        role="button"
        title={linkTitle}
        onClick={() => onToggleReadUserNotification(notification.id, !notification.read)}>
        <SocrataIcon name="checkmark3" />
      </span>
    );
  }

  renderClearIcon() {
    const {
      notification,
      onClearUserNotification,
      I18n
    } = this.props;

    return (
      <span
        styleName="link-icon"
        className="user-notification-clear-icon"
        role="button"
        title={I18n.t('shared_site_chrome_notifications.clear_notification_text')}
        onClick={() => onClearUserNotification(notification.id)}>
        <SocrataIcon name="close-2" />
      </span>
    );
  }

  renderUserLink() {
    const { notification } = this.props;

    if (_.isNull(notification.userProfileLink)) {
      return <span styleName="user-name">{notification.userName}</span>;
    }

    return <a href={notification.userProfileLink} target="_blank">{notification.userName}</a>;
  }

  renderNotificationTitle() {
    const {
      notification,
      I18n
    } = this.props;
    let alertOrNotificationTitle;

    if (notification.type === 'alert') {
      alertOrNotificationTitle = notification.alertName;
    } else {
      alertOrNotificationTitle = I18n.t(notification.activityUniqueKey, { scope: 'shared_site_chrome_notifications' });
    }
    const notificationTitle = (
      <div>
        <strong className="user-notification-title">
          {this.renderAlertLabel()}
          {alertOrNotificationTitle}
        </strong>

        <span className="notification-body">{notification.messageBody}</span>
      </div>
    );

    if (_.isNull(notification.link)) {
      return <span styleName="title">{notificationTitle}</span>;
    }

    return <a styleName="title" href={notification.link} target="_blank">{notificationTitle}</a>;
  }

  render() {
    const {
      notification,
      isTransientNotification,
      I18n
    } = this.props;
    const isUnread = !notification.read;
    let notificationByLabel;
    if (notification.type === 'alert') {
      notificationByLabel = null;
    } else {
      notificationByLabel = <span>{I18n.t('shared_site_chrome_notifications.by_label')}</span>;
    }
    return (
      <li
        styleName={classNames('notification-item', notification.type, {
          'unread': isUnread,
          'transient': isTransientNotification
        })}
        className={classNames('user-notification-item', { 'unread': isUnread })}
        data-notification-id={notification.id}>
        {this.renderSocrataLogo()}

        <div styleName="notification-wrapper" className="clearfix">
          <div styleName="notification-info">
            {this.renderNotificationTitle()}
            <p styleName="timestamp" className="notification-timestamp">
              <span>{moment.utc(notification.createdAt).locale(I18n.locale).fromNow()}</span>
              {notificationByLabel}
              {this.renderUserLink()}
            </p>
          </div>

          <div styleName="actions-wrapper">
            {this.renderUnreadIcon()}
            {this.renderClearIcon()}
          </div>
        </div>
      </li>
    );
  }
}

UserNotification.propTypes = {
  notification: PropTypes.shape({
    activityType: PropTypes.string,
    activityUniqueKey: PropTypes.string.isRequired,
    alertName: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    read: PropTypes.bool.isRequired,
    link: PropTypes.string,
    messageBody: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    userProfileLink: PropTypes.string
  }).isRequired,
  isTransientNotification: PropTypes.bool.isRequired,
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired
};

UserNotification.defaultProps = {
  moveTransientNotificationIntoPanel: () => {}
};

export default connectLocalization(cssModules(UserNotification, styles, { allowMultiple: true }));
