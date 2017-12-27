import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';

import connectLocalization from 'common/i18n/components/connectLocalization';

import styles from './tabs.module.scss';

class Tabs extends React.Component {
  renderIndicator(tab) {
    if (tab !== 'all') {
      return <span styleName={classNames('type-indicator', `${tab}-dot`)} />;
    }
  }

  renderTabs() {
    const {
      tabs,
      selectedTab,
      filterNotifications,
      I18n
    } = this.props;

    return tabs.map((tab, index) =>
      <li key={index} styleName="tab">
        <button
          styleName={classNames({ 'selected': tab === selectedTab })}
          className="notification-tab"
          onClick={() => filterNotifications(tab)}>
          {this.renderIndicator(tab)}
          {I18n.t(`shared_site_chrome_notifications.filter_${tab}_notifications_tab_text`)}
        </button>
      </li>
    );
  }

  render() {
    const {
      children,
      hasSecondaryPanel
    } = this.props;
    const notificationItemsClassName = classNames('notification-items-wrapper', {
      'has-secondary-panel': hasSecondaryPanel
    });

    return (
      <div styleName="notification-panel">
        <ul styleName="notification-filters" className="clearfix">
          {this.renderTabs()}
        </ul>

        <div styleName={notificationItemsClassName}>
          <ul styleName="notification-items">
            {children}
          </ul>
        </div>
      </div>
    );
  }
}

Tabs.propTypes = {
  tabs: PropTypes.array.isRequired,
  selectedTab: PropTypes.string.isRequired,
  filterNotifications: PropTypes.func.isRequired,
  children: PropTypes.element.isRequired,
  hasSecondaryPanel: PropTypes.bool.isRequired
};

export default connectLocalization(cssModules(Tabs, styles, { allowMultiple: true }));
