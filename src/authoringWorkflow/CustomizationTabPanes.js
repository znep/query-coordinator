import React from 'react';
import CustomizationTabPane from './CustomizationTabPane';

export var CustomizationTabPanes = React.createClass({
  propTypes: {
    tabs: React.PropTypes.array,
    selection: React.PropTypes.string
  },

  paneAttributes(tab) {
    return {
      key: tab.id,
      id: tab.id,
      show: tab.id === this.props.selection
    };
  },

  pane(tab) {
    return (
      <CustomizationTabPane {...this.paneAttributes(tab)}>
        {React.createElement(tab.paneComponent)}
      </CustomizationTabPane>
    );
  },

  render() {
    return (
      <div className="visualization-tab-panes">
        {_.map(this.props.tabs, tab => { return this.pane(tab); })}
      </div>
    );
  }
});

export default CustomizationTabPanes;
