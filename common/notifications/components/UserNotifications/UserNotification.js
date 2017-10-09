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
      is_read,
      onToggleReadUserNotification,
      I18n
    } = this.props;
    let linkTitle;

    if (is_read) {
      linkTitle = I18n.t('shared_site_chrome_notifications.mark_as_unread');
    } else {
      linkTitle = I18n.t('shared_site_chrome_notifications.mark_as_read');
    }

    return (
      <a styleName="link-icon"
        className="toggle-notification-read-state"
        href="javascript:void(0)"
        title={linkTitle}
        onClick={() => onToggleReadUserNotification(id, !is_read)}>
        <SocrataIcon name="checkmark3" />
      </a>
    );
  }

  renderClearIcon() {
    const {
      id,
      onClearUserNotification,
      I18n
    } = this.props;

    return (
      <a styleName="link-icon"
         className="user-notification-clear-icon"
         href="javascript:void(0)"
         title={I18n.t('shared_site_chrome_notifications.clear_notification_text')}
         onClick={() => onClearUserNotification(id)}>
        <SocrataIcon name="close-2" />
      </a>
    );
  }

  renderUserLink() {
    const {
      user_name,
      user_profile_link
    } = this.props;

    if (_.isNull(user_profile_link)) {
      return <span styleName="user-name">{user_name}</span>;
    } else {
      return <a href={user_profile_link} target="_blank">{user_name}</a>;
    }
  }

  render() {
    const {
      id,
      is_read,
      link,
      title,
      type,
      message_body,
      created_at,
      I18n
    } = this.props;
    const isUnread = !is_read;
    const notificationLink = _.isNull(link) ? 'javascript:void(0)' : link;

    return (
      <li styleName={classNames("notification-item", type, { 'unread': isUnread })}
        className={classNames("user-notification-item clearfix", { 'unread': isUnread })}
        data-notification-id={id}>
        <div styleName="notification-info">
          <a styleName="title"
            target="_blank"
            href={notificationLink}>
            <strong className="user-notification-title">
              {this.renderAlertLabel()}
              {title}
            </strong>

            <span className="notification-body">{message_body}</span>
          </a>

          <p styleName="timestamp" className="notification-timestamp">
            <span>{moment.utc(created_at).fromNow()}</span>
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
  activity_type: PropTypes.string.isRequired,
  message_body: PropTypes.string.isRequired,
  created_at: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  is_read: PropTypes.bool.isRequired,
  link: PropTypes.string,
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  user_name: PropTypes.string.isRequired,
  user_profile_link: PropTypes.string.isRequired
};

export default connectLocalization(cssModules(UserNotification, styles, { allowMultiple: true }));
