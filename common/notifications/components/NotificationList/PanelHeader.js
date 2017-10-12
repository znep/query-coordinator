import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';

import connectLocalization from 'common/i18n/components/connectLocalization';

import { SocrataIcon } from 'common/components/SocrataIcon';
import styles from './panel-header.scss';

class PanelHeader extends Component {
  renderNewNotificationsLabel() {
    const {
      unreadCount,
      I18n
    } = this.props;

    if (unreadCount > 0) {
      return (
        <em styleName='new-notifications-label'
          className='new-notifications-label'>
          <span>{unreadCount}</span>
          <span>{I18n.t('shared_site_chrome_notifications.new_label')}</span>
        </em>
      );
    }
  }

  render() {
    const {
      onClosePanel,
      panelHeaderText
    } = this.props;

    return (
      <div styleName='header'>
        <div styleName='header-icon'>
          <SocrataIcon name="bell" />
        </div>

        <h3>
          {panelHeaderText}
          {this.renderNewNotificationsLabel()}
        </h3>

        <span styleName="close-panel-link"
          className='close-notifications-panel-link'
          role="button"
          onClick={onClosePanel}>
          <SocrataIcon name="close-2" />
        </span>
      </div>
    );
  }
}

PanelHeader.propTypes = {
  onClosePanel: PropTypes.func.isRequired,
  panelHeaderText: PropTypes.string.isRequired,
  unreadCount: PropTypes.number.isRequired
};

export default connectLocalization(cssModules(PanelHeader, styles));
