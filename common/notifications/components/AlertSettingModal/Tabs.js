import React, { Component } from 'react';
import styles from './tabs.scss';
import cssModules from 'react-css-modules';
import connectLocalization from 'common/i18n/components/connectLocalization';
import classNames from 'classnames';

class Tabs extends Component {
  render() {
    const { selectedTab, I18n } = this.props;
    return (
      <div styleName="tabs">
        <ul className="nav">
          <li
            styleName={classNames({ 'active': selectedTab == 'notification' })}>
            <a className="nav-link">
              {I18n.t('shared_site_chrome_notifications.alert_setting_modal.tab.notification')}
            </a>
          </li>
        </ul>
      </div>
    );
  }
}

export default connectLocalization(cssModules(Tabs, styles, { allowMultiple: true }));
