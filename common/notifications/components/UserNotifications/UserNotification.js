import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import moment from 'moment';

import connectLocalization from 'common/i18n/components/connectLocalization';

import { SocrataIcon } from 'common/components/SocrataIcon';
import { STATUS_ACTIVITY_TYPES } from 'common/notifications/constants';
import styles from './user-notification.scss';

class UserNotification extends React.Component {
  renderTitle() {
    const { activity_type } = this.props;

    if (_.includes(STATUS_ACTIVITY_TYPES, activity_type)) {
      return <strong>{activity_type}</strong>;
    } else {
      return (
        <strong className="user-notification-title">
          <em>Alert</em>
          {activity_type}
        </strong>
      );
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
      linkTitle = I18n.t('mark_as_unread');
    } else {
      linkTitle = I18n.t('mark_as_read');
    }

    return (
      <a styleName="link-icon"
        className="toggle-notification-read-state"
        href="javascript:void(0)"
        title={linkTitle}
        onClick={() => { onToggleReadUserNotification(id, !is_read) }}>
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
         title={I18n.t('clear_notification_text')}
         onClick={() => { onClearUserNotification(id) }}>
        <SocrataIcon name="close-2" />
      </a>
    );
  }

  convertToUrlComponent(text) {
    let output = text.
      replace(/\s+/g, '-').
      replace(/[^a-zA-Z0-9_\-]/g, '-').
      replace(/\-+/g, '-');

    if (output.length < 1) {
      output = '-';
    }

    return output.slice(0, 50);
  }

  getUserProfileLink(domain, user_name, user_id) {
    return '//' + domain + '/profile/' + this.convertToUrlComponent(user_name) + '/' + user_id;
  }

  getDatasetPrimerLink(domain, dataset_name, dataset_uid) {
    return '//' + domain + '/dataset/' + this.convertToUrlComponent(dataset_name) + '/' + dataset_uid;
  }

  renderUserLink() {
    const {
      acting_user_id,
      domain_cname,
      acting_user_name
    } = this.props;

    if (acting_user_id && domain_cname && acting_user_name) {
      return <a href={this.getUserProfileLink(domain_cname, acting_user_name, acting_user_id)}
        target="_blank">
        {acting_user_name}
      </a>;
    } else {
      return <span styleName="user-name">{acting_user_name}</span>;
    }
  }

  render() {
    const {
      id,
      is_read,
      activity_type,
      dataset_name,
      dataset_uid,
      domain_cname,
      acting_user_name,
      message_body,
      created_at,
      I18n
    } = this.props;
    const notificationStyleNames = classNames("notification-item", {
      'alert': !_.includes(STATUS_ACTIVITY_TYPES, activity_type),
      'status': _.includes(STATUS_ACTIVITY_TYPES, activity_type),
      'unread': !is_read
    });

    return (
      <li styleName={notificationStyleNames}
        className={classNames("user-notification-item clearfix", { 'unread': !is_read })}
        data-notification-id={id}>
        <div styleName="notification-info">
          <a styleName="title"
            target="_blank"
            href={this.getDatasetPrimerLink(domain_cname, dataset_name, dataset_uid)}>
            {this.renderTitle()}
            <span className="notification-body">{dataset_name || message_body}</span>
          </a>

          <p styleName="timestamp" className="notification-timestamp">
            <em>
              {moment.utc(created_at).fromNow()}
              &nbsp;
              {I18n.t('by_label')}
            </em>
            &nbsp;
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
  id: PropTypes.number.isRequired,
  is_read: PropTypes.bool,
  activity_type: PropTypes.string.isRequired,
  dataset_name: PropTypes.string.isRequired,
  dataset_uid: PropTypes.string.isRequired,
  created_at: PropTypes.string.isRequired,
  message_body: PropTypes.string.isRequired,
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired
};

UserNotification.defaultProps = {
  is_read: false
};

export default connectLocalization(cssModules(UserNotification, styles, { allowMultiple: true }));
