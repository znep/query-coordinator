import React from 'react';
import CustomizationTabPane from './CustomizationTabPane';

export var CustomizationTabPanes = React.createClass({
  propTypes: {
    tabs: React.PropTypes.array,
    selection: React.PropTypes.string
  },

  paneAttributes: function(tab) {
    return {
      key: tab.id,
      id: tab.id,
      show: tab.id === this.props.selection
    };
  },

  pane: function(tab) {
    return (
      <CustomizationTabPane {...this.paneAttributes(tab)}>
        {React.createElement(tab.paneComponent)}
      </CustomizationTabPane>
    );
  },

  render: function() {
    return (
      <div>
        {_.map(this.props.tabs, (tab) => { return this.pane(tab); })}
      </div>
    );
  }
});

export default CustomizationTabPanes;
