import _ from 'lodash';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';

import styles from './index.module.scss';

const TABS = {
  ADVANCED_ALERT: { name: 'advancedAlert', translationName: 'advance_alert' },
  CUSTOM_ALERT: { name: 'customAlert', translationName: 'custom_alert' }
};

/**
  Displays the tabs for Alert create/edit. Current tabs are
    - Advanced Alert (Create alert soql using form fields)
    - Custom Alert (Create alert using raw soql query string)
*/
class Tabs extends Component {
  translationScope = 'shared.components.create_alert_modal.tab';

  renderTab(tab) {
    const { editMode, onTabChange, selectedTab } = this.props;
    const createMode = !editMode;
    const tabName = _.get(tab, 'name');
    const translationName = _.get(tab, 'translationName');

    if (createMode || selectedTab === tabName) {
      return (
        <li
          className="custom-alert"
          onClick={() => onTabChange(tabName)}
          styleName={classNames({ 'active': selectedTab === tabName })}>
          <a className="nav-link">
            {I18n.t(translationName, { scope: this.translationScope })}
          </a>
        </li>
      );
    }
  }

  render() {
    const { selectedTab, onTabChange, editMode } = this.props;

    return (
      <div styleName="tabs">
        <ul className="nav">
          {this.renderTab(TABS.CUSTOM_ALERT)}
          {this.renderTab(TABS.ADVANCED_ALERT)}
        </ul>
      </div>
    );
  }
}

Tabs.defaultProps = {
  editMode: false,
  selectedTab: TABS.CUSTOM_ALERT
};

Tabs.propTypes = {
  editMode: PropTypes.bool,
  selectedTab: PropTypes.string,
  onTabChange: PropTypes.func.isRequired
};

export default cssModules(Tabs, styles, { allowMultiple: true });
