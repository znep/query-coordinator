import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import moment from 'moment';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import { SocrataIcon } from 'common/components/SocrataIcon';
import styles from './user-notification.scss';

class UserNotification extends React.Component {
  renderAlertLabel() {
    const {
      type,
      I18n
    } = this.props;

    if (_.isEqual(type, 'alert')) {
      return <em>{I18n.t('shared_site_chrome_notifications.filter_alert_notifications_tab_text')}</em>;
    }
  }

  renderUnreadIcon() {
    const {
      id,
      isRead,
      onToggleReadUserNotification,
      I18n
    } = this.props;
    let linkTitle;

    if (isRead) {
      linkTitle = I18n.t('shared_site_chrome_notifications.mark_as_unread');
    } else {
      linkTitle = I18n.t('shared_site_chrome_notifications.mark_as_read');
    }

    return (
      <span styleName="link-icon"
        className="toggle-notification-read-state"
        role="button"
        title={linkTitle}
        onClick={() => onToggleReadUserNotification(id, !isRead)}>
        <SocrataIcon name="checkmark3" />
      </span>
    );
  }

  renderClearIcon() {
    const {
      id,
      onClearUserNotification,
      I18n
    } = this.props;

    return (
      <span styleName="link-icon"
        className="user-notification-clear-icon"
        role="button"
        title={I18n.t('shared_site_chrome_notifications.clear_notification_text')}
        onClick={() => onClearUserNotification(id)}>
        <SocrataIcon name="close-2" />
      </span>
    );
  }

  renderUserLink() {
    const {
      userName,
      userProfileLink
    } = this.props;

    if (_.isNull(userProfileLink)) {
      return <span styleName="user-name">{userName}</span>;
    }

    return <a href={userProfileLink} target="_blank">{userName}</a>;
  }

  renderNotificationTitle() {
    const {
      link,
      title,
      messageBody
    } = this.props;
    const notificationTitle = (
      <div>
        <strong className="user-notification-title">
          {this.renderAlertLabel()}
          {title}
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
      id,
      isRead,
      type,
      createdAt,
      I18n
    } = this.props;
    const isUnread = !isRead;

    return (
      <li styleName={classNames("notification-item", type, { 'unread': isUnread })}
        className={classNames("user-notification-item clearfix", { 'unread': isUnread })}
        data-notification-id={id}>
        <div styleName="notification-info">
          {this.renderNotificationTitle()}

          <p styleName="timestamp" className="notification-timestamp">
            <span>{moment.utc(createdAt).fromNow()}</span>
            <span>{I18n.t('shared_site_chrome_notifications.by_label')}</span>
            {this.renderUserLink()}
          </p>
        </div>

        <div styleName="actions-wrapper">
          {this.renderUnreadIcon()}
          {this.renderClearIcon()}
        </div>
      </li>
    );
  }
}

UserNotification.propTypes = {
  activityType: PropTypes.string.isRequired,
  messageBody: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  isRead: PropTypes.bool.isRequired,
  link: PropTypes.string,
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
  userProfileLink: PropTypes.string.isRequired
};

export default connectLocalization(cssModules(UserNotification, styles, { allowMultiple: true }));
