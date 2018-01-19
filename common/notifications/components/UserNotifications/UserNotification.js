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

const scope = 'shared_site_chrome_notifications';

class UserNotification extends React.Component {
  state = { fadeAwayTimeoutId: null };

  componentWillMount() {
    const { isTransientNotification } = this.props;

    if (isTransientNotification) {
      const { notification, moveTransientNotificationIntoPanel } = this.props;
      let { fadeAwayTimeoutId } = this.state;

      fadeAwayTimeoutId = setTimeout(() => {
        moveTransientNotificationIntoPanel(notification.id);
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
    const { I18n, notification } = this.props;

    if (notification.type === 'alert') {
      return <em>{I18n.t('filter_alert_notifications_tab_text', { scope })}</em>;
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
    const { id, read } = notification;
    const linkTitleI18nKey = read ? 'mark_as_read' : 'mark_as_unread';

    return (
      <span
        styleName="link-icon"
        className="toggle-notification-read-state"
        role="button"
        title={I18n.t(linkTitleI18nKey, { scope })}
        onClick={() => onToggleReadUserNotification(id, !read)}>
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
        title={I18n.t('clear_notification_text', { scope })}
        onClick={() => onClearUserNotification(notification.id)}>
        <SocrataIcon name="close-2" />
      </span>
    );
  }

  renderUserLink() {
    const { userName, userProfileLink } = this.props.notification;

    if (_.isNull(userProfileLink)) {
      return <span styleName="user-name">{userName}</span>;
    }

    return <a href={userProfileLink} target="_blank">{userName}</a>;
  }

  renderNotificationTitle() {
    const {
      notification,
      I18n
    } = this.props;
    const {
      activityUniqueKey,
      alertName,
      link,
      messageBody,
      type
    } = notification;
    let alertOrNotificationTitle = alertName;

    if (type !== 'alert') {
      alertOrNotificationTitle = I18n.t(activityUniqueKey, { scope });
    }

    const notificationTitle = (
      <div>
        <strong className="user-notification-title">
          {this.renderAlertLabel()}
          {alertOrNotificationTitle}
        </strong>

        <span className="notification-body">{messageBody}</span>
      </div>
    );

    if (_.isNull(link)) {
      return <span styleName="title">{notificationTitle}</span>;
    }

    return <a styleName="title" href={link} target="_blank">{notificationTitle}</a>;
  }

  render() {
    const {
      notification,
      isTransientNotification,
      I18n
    } = this.props;
    const {
      createdAt,
      id,
      read,
      type
    } = notification;
    const isUnread = !read;
    let notificationByLabel = null;

    if (type !== 'alert') {
      notificationByLabel = <span>{I18n.t('by_label', { scope: 'shared_site_chrome_notifications' })}</span>;
    }

    return (
      <li
        styleName={classNames('notification-item', type, {
          'unread': isUnread,
          'transient': isTransientNotification
        })}
        className={classNames('user-notification-item', { 'unread': isUnread })}
        data-notification-id={id}>
        {this.renderSocrataLogo()}

        <div styleName="notification-wrapper" className="clearfix">
          <div styleName="notification-info">
            {this.renderNotificationTitle()}
            <p styleName="timestamp" className="notification-timestamp">
              <span>{moment.utc(createdAt).locale(I18n.locale).fromNow()}</span>
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
  isTransientNotification: PropTypes.bool.isRequired,
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
  moveTransientNotificationIntoPanel: PropTypes.func,
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired
};

UserNotification.defaultProps = {
  moveTransientNotificationIntoPanel: () => {}
};

export default connectLocalization(cssModules(UserNotification, styles, { allowMultiple: true }));
