import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import { SocrataIcon } from 'common/components/SocrataIcon';
import styles from './bell.scss';

class Bell extends Component {
  render() {
    const {
      toggleNotificationPanel,
      unreadNotificationCount,
      hasUnreadNotificationsText,
      noUnreadNotificationsText
    } = this.props;

    const hasUnreadNotifications = unreadNotificationCount > 0;

    const tipsyText = hasUnreadNotifications ? hasUnreadNotificationsText : noUnreadNotificationsText;

    return (
      <button
        styleName={classNames('button', { 'unread': hasUnreadNotifications })}
        className={classNames('notifications-bell', { 'has-unread-notifications': hasUnreadNotifications })}
        onClick={toggleNotificationPanel}
        tabIndex="0"
        aria-haspopup="true"
        title={tipsyText}
        aria-label={tipsyText}>
        <SocrataIcon name="bell" />
      </button>
    );
  }
}

Bell.propTypes = {
  toggleNotificationPanel: PropTypes.func.isRequired,
  unreadNotificationCount: PropTypes.number.isRequired,
  hasUnreadNotificationsText: PropTypes.string.isRequired,
  noUnreadNotificationsText: PropTypes.string.isRequired
};

export default cssModules(Bell, styles, { allowMultiple: true });
