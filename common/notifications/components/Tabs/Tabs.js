import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import connectLocalization from 'common/i18n/components/connectLocalization';

import styles from './tabs.module.scss';

class Tabs extends React.Component {
  renderTabs() {
    const {
      tabs,
      selectedTab,
      filterNotifications,
      I18n
    } = this.props;
    const scope = 'shared_site_chrome_notifications';

    return tabs.map((tab, index) =>
      <li key={index} styleName="tab">
        <button
          className="notification-tab"
          styleName={classNames({ 'selected': tab === selectedTab })}
          onClick={() => filterNotifications(tab)}>
          <span styleName={classNames('type-indicator', `${tab}-dot`)} />
          {I18n.t(`filter_${tab}_notifications_tab_text`, { scope })}
        </button>
      </li>
    );
  }

  render() {
    const { children, hasSecondaryPanel, selectedTab } = this.props;
    const notificationItemsClassName = classNames('notification-items-wrapper', {
      'has-secondary-panel': hasSecondaryPanel
    });

    return (
      <div styleName="notification-panel">
        <ul styleName="notification-filters" className="clearfix">{this.renderTabs()}</ul>
        <div styleName={notificationItemsClassName} id={`${selectedTab}-notification-items`}>
          <ul styleName="notification-items">{children}</ul>
        </div>
      </div>
    );
  }
}

Tabs.propTypes = {
  children: PropTypes.element.isRequired,
  filterNotifications: PropTypes.func.isRequired,
  hasSecondaryPanel: PropTypes.bool.isRequired,
  selectedTab: PropTypes.string.isRequired,
  tabs: PropTypes.array.isRequired
};

export default connectLocalization(cssModules(Tabs, styles, { allowMultiple: true }));
