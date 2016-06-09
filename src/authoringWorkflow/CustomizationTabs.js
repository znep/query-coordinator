import React from 'react';
import { CustomizationTab } from './CustomizationTab';

export var CustomizationTabs = React.createClass({
  propTypes: {
    tabs: React.PropTypes.array,
    selection: React.PropTypes.string,
    onTabNavigation: React.PropTypes.func
  },

  tabAttributes(tab) {
    return {
      key: tab.id,
      id: tab.id,
      title: tab.title,
      selected: this.props.selection === tab.id,
      onTabNavigation: this.props.onTabNavigation
    };
  },

  tab(tab) {
    return <CustomizationTab {...this.tabAttributes(tab)} />;
  },

  render() {
    return (
      <ul className="nav-tabs" onClick={this.props.onTabNavigation}>
        {_.map(this.props.tabs, (tab) => { return this.tab(tab); })}
      </ul>
    );
  }
});

export default CustomizationTabs;
