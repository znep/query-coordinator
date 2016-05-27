import React from 'react';
import classNames from 'classnames';

export var CustomizationTabPanes = React.createClass({
  propTypes: {
    tabs: React.PropTypes.array,
    currentTabSelection: React.PropTypes.string
  },

  isCurrentlySelectedTab: function(id) {
    return _.includes(this.props.currentTabSelection, id);
  },

  tabPanes: function() {
    return _.map(this.props.tabs, tab => {
      var isHidden = !this.isCurrentlySelectedTab(tab.id);
      var attributes = {
        key: tab.id,
        id: `${tab.id}-panel`,
        className: classNames({'customization-tab-pane_hidden': isHidden}),
        role: 'tabpanel',
        'aria-hidden': isHidden,
        'aria-labelledby': `${tab.id}-link`
      };

      return (
        <div {...attributes}>
          {tab.content}
        </div>
      );
    });
  },

  render: function() {
    return <div>{this.tabPanes()}</div>;
  }
});
