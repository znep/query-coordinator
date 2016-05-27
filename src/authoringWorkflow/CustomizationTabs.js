import React from 'react';
import classNames from 'classnames';

export var CustomizationTabs = React.createClass({
  propTypes: {
    tabs: React.PropTypes.array,
    currentTabSelection: React.PropTypes.string,
    onTabNavigation: React.PropTypes.func
  },

  isCurrentlySelectedTab: function(id) {
    return _.includes(this.props.currentTabSelection, id);
  },

  tabListItems: function() {
    return _.map(this.props.tabs, tab => {
      var isSelected = this.isCurrentlySelectedTab(tab.id);
      var listItemAttributes = {
        key: tab.id,
        className: classNames('tab-link', {'current': isSelected}),
        role: 'presentation'
      };
      var linkAttributes = {
        id: `${tab.id}-link`,
        href: `#${tab.id}`,
        onFocus: this.props.onTabNavigation,
        'aria-selected': isSelected,
        'aria-controls': `${tab.id}-panel`
      };

      return (
        <li {...listItemAttributes}>
          <a {...linkAttributes}>{tab.title}</a>
        </li>
      );
    });
  },

  render: function() {
    return (
      <ul className="nav-tabs" onClick={this.props.onTabNavigation}>
        {this.tabListItems()}
      </ul>
    );
  }
});
