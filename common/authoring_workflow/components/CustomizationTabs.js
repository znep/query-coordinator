import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import CustomizationTab from './CustomizationTab';

export class CustomizationTabs extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'tabAttributes',
      'tab'
    ]);
  }

  tabAttributes(tab) {
    return {
      key: tab.id,
      id: tab.id,
      title: tab.title,
      icon: tab.icon,
      selected: this.props.selection === tab.id,
      onTabNavigation: this.props.onTabNavigation
    };
  }

  tab(tab) {
    return <CustomizationTab {...this.tabAttributes(tab)} />;
  }

  render() {
    return (
      <ul role="tablist" className="nav-tabs" onClick={this.props.onTabNavigation}>
        {_.map(this.props.tabs, (tab) => { return this.tab(tab); })}
      </ul>
    );
  }
}

CustomizationTabs.propTypes = {
  tabs: PropTypes.array,
  selection: PropTypes.string,
  onTabNavigation: PropTypes.func
};

export default CustomizationTabs;
