import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import connectLocalization from 'common/i18n/components/connectLocalization';
import { SocrataIcon } from 'common/components/SocrataIcon';

import styles from './bell.module.scss';

class Bell extends Component {
  render() {
    const { I18n, hasUnreadNotifications, toggleNotificationPanel } = this.props;
    let tipsyText;
    const scope = 'shared_site_chrome_notifications';

    if (hasUnreadNotifications) {
      tipsyText = I18n.t('has_unread_notifications', { scope });
    } else {
      tipsyText = I18n.t('no_unread_notifications', { scope });
    }

    return (
      <button
        aria-haspopup="true"
        aria-label={tipsyText}
        className={classNames('notifications-bell', { 'has-unread-notifications': hasUnreadNotifications })}
        onClick={toggleNotificationPanel}
        styleName={classNames('button', { unread: hasUnreadNotifications })}
        tabIndex="0"
        title={tipsyText}>
        <SocrataIcon name="bell" />
      </button>
    );
  }
}

Bell.propTypes = {
  hasUnreadNotifications: PropTypes.bool.isRequired,
  toggleNotificationPanel: PropTypes.func.isRequired
};

export default connectLocalization(cssModules(Bell, styles, { allowMultiple: true }));
