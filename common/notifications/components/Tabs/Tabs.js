import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';

import connectLocalization from 'common/i18n/components/connectLocalization';

import styles from './tabs.scss';

class Tabs extends React.Component {
  renderIndicator(tab) {
    const { I18n } = this.props;
    const filterAllText = I18n.t('filter_all_notifications_tab_text');
    const filterStatusText = I18n.t('filter_status_notifications_tab_text');
    const filterAlertText = I18n.t('filter_alert_notifications_tab_text');

    if (tab !== filterAllText) {
      const indicatorStyleName = classNames('type-indicator', {
        'alert-dot': tab == filterAlertText,
        'status-dot': tab == filterStatusText
      });

      return <span styleName={indicatorStyleName} />;
    }
  }

  renderTabs() {
    const {
      tablist,
      selectedTab,
      filterNotifications
    } = this.props;

    return tablist.map((tab, index) =>
      <li key={index}>
        <button
          className="notification-tab"
          styleName={classNames({ 'selected': tab === selectedTab })}
          onClick={() => { filterNotifications(tab) }}>
          {this.renderIndicator(tab)}
          {tab}
        </button>
      </li>
    );
  }

  render() {
    const {
      children,
      hasSecondaryPanel
    } = this.props;

    return (
      <div styleName="notification-panel">
        <ul styleName="notification-filters" className="clearfix">
          {this.renderTabs()}
        </ul>

        <div styleName={classNames("notification-items-wrapper", { "has-secondary-panel": hasSecondaryPanel })}>
          <ul styleName="notification-items">
            {children}
          </ul>
        </div>
      </div>
    );
  }
}

Tabs.propTypes = {
  tablist: PropTypes.array.isRequired,
  selectedTab: PropTypes.string.isRequired,
  filterNotifications: PropTypes.func.isRequired,
  children: React.PropTypes.element.isRequired,
  hasSecondaryPanel: PropTypes.bool.isRequired
};

export default connectLocalization(cssModules(Tabs, styles, { allowMultiple: true }));
