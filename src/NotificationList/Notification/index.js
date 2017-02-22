import React from 'react';
import cssModules from 'react-css-modules';
import styles from './notification.scss';
import NotificationPropTypes from '../../PropTypes/NotificationPropTypes';

class Notification extends React.Component {
  renderUnreadIcon() {
    if (this.props.isUnread === true) {
      return (
        <div styleName="unread-dot" />
      );
    }

    return null;
  }

  render() {
    const {
      title,
      titleLink,
      body
    } = this.props;

    return (
      <div styleName="container">
        {this.renderUnreadIcon()}
        <a styleName="title" href={titleLink} target="_blank" rel="noopener noreferrer">{title}</a>
        <div styleName="body">
          {body}...
        </div>
      </div>
    );
  }
}

Notification.propTypes = NotificationPropTypes;

export default cssModules(Notification, styles);
