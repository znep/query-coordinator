import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import connectLocalization from 'common/i18n/components/connectLocalization';
import I18n from 'common/i18n';

import styles from './tabs.module.scss';

class Tabs extends Component {
  render() {
    const { selectedTab, onTabChange, showMyAlertsTab } = this.props;
    const translationScope = 'shared_site_chrome_notifications.alert_setting_modal.tab';
    let myAlertsTab = null;

    if (showMyAlertsTab) {
      myAlertsTab = (
        <li
          styleName={classNames({ 'active': selectedTab == 'my_alerts' })}>
          <a className="nav-link" onClick={() => onTabChange('my_alerts')} >
            {I18n.t('my_alerts', { scope: translationScope })}
          </a>
        </li>
      );
    }

    return (
      <div styleName="tabs">
        <ul className="nav">
          <li
            styleName={classNames({ 'active': selectedTab == 'notification' })}>
            <a className="nav-link" onClick={() => onTabChange('notification')}>
              {I18n.t('notification', { scope: translationScope })}
            </a>
          </li>
          {myAlertsTab}
        </ul>
      </div>
    );
  }
}

Tabs.propTypes = {
  selectedTab: PropTypes.string,
  onTabChange: PropTypes.func.isRequired
};

export default connectLocalization(cssModules(Tabs, styles, { allowMultiple: true }));
