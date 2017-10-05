import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';

import connectLocalization from 'common/i18n/components/connectLocalization';

import { SocrataIcon } from 'common/components/SocrataIcon';
import styles from './bell.scss';

class Bell extends Component {
  render() {
    const {
      toggleNotificationPanel,
      hasUnreadNotifications,
      I18n
    } = this.props;
    let tipsyText;

    if (hasUnreadNotifications) {
      tipsyText = I18n.t('shared_site_chrome_notifications.has_unread_notifications');
    } else {
      tipsyText = I18n.t('shared_site_chrome_notifications.no_unread_notifications');
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
  hasUnreadNotifications: PropTypes.bool.isRequired
};

export default connectLocalization(cssModules(Bell, styles, { allowMultiple: true }));
