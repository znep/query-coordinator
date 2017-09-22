import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './panel-footer.scss';
import I18n from 'common/i18n';

class PanelFooter extends Component {
  render() {
    const {
      markAllAsRead,
      hasUnreadNotifications
    } = this.props;

    return (
      <div styleName='footer-bar'>
        <button styleName='primary-button'
          className='mark-all-as-read-button'
          disabled={!hasUnreadNotifications}
          onClick={markAllAsRead}>
          {I18n.t('shared.site_chrome.notifications.mark_as_read')}
        </button>
      </div>
    );
  }
}

PanelFooter.propTypes = {
  hasUnreadNotifications: PropTypes.bool.isRequired,
  markAllAsRead: PropTypes.func.isRequired
};

export default cssModules(PanelFooter, styles);
