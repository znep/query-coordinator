import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import styles from './panel-header.scss';
import I18n from 'common/i18n';

class PanelHeader extends Component {
  renderNewNotificationsLabel() {
    const { unreadCount } = this.props;

    if (unreadCount > 0) {
      return (
        <em styleName='new-notifications-label'
          className='new-notifications-label'>
          {unreadCount}
          {I18n.t('shared.site_chrome.notifications.new_label')}
        </em>
      );
    }

    return null;
  }

  render() {
    const {
      onClosePanel,
      panelHeaderText
    } = this.props;

    return (
      <div styleName='header'>
        <div styleName='header-icon'>
          <span className='socrata-icon-bell'></span>
        </div>

        <h3>
          {panelHeaderText}
          {this.renderNewNotificationsLabel()}
        </h3>

        <a styleName='close-panel-link'
          className='close-notifications-panel-link'
          href='javascript:void(0)'
          onClick={onClosePanel}>
          <span className='socrata-icon-close-2'></span>
        </a>
      </div>
    );
  }
}

PanelHeader.propTypes = {
  onClosePanel: PropTypes.func.isRequired,
  panelHeaderText: PropTypes.string.isRequired,
  unreadCount: PropTypes.number.isRequired
};

export default cssModules(PanelHeader, styles);
