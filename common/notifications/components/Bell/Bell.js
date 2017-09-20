import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import { SocrataIcon } from 'common/components/SocrataIcon';
import styles from './bell.scss';
import I18n from 'common/i18n';

class Bell extends Component {
  render() {
    const {
      toggleNotificationPanel,
      unreadNotificationCount
    } = this.props;

    let tipsyText;

    let hasUnreadNotifications = unreadNotificationCount > 0;

    if (hasUnreadNotifications) {
      tipsyText = I18n.t('shared.site_chrome.notifications.has_unread_notifications');
    } else {
      tipsyText = I18n.t('shared.site_chrome.notifications.no_unread_notifications');
    }

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
  unreadNotificationCount: PropTypes.number.isRequired
};

export default cssModules(Bell, styles, { allowMultiple: true });
