import React from 'react';
import { connect } from 'react-redux';

import CustomizationTabs from './CustomizationTabs';
import CustomizationTabPanes from './CustomizationTabPanes';
import Visualization from './Visualization';

import DataPane from './panes/DataPane';
import TitleAndDescriptionPane from './panes/TitleAndDescriptionPane';
import ColorsAndStylePane from './panes/ColorsAndStylePane';
import AxisAndScalePane from './panes/AxisAndScalePane';
import LabelsPane from './panes/LabelsPane';
import FlyoutsPane from './panes/FlyoutsPane';

export var AuthoringWorkflow = React.createClass({
  getInitialState: function() {
    return {
      currentTabSelection: 'authoring-data'
    };
  },

  getDefaultProps: function() {
    return {
      tabs: [
        {id: 'authoring-data', title: 'Data', paneComponent: DataPane},
        {id: 'authoring-title-and-description', title: 'Tile & Description', paneComponent: TitleAndDescriptionPane},
        {id: 'authoring-colors-and-style', title: 'Colors & Style', paneComponent: ColorsAndStylePane},
        {id: 'authoring-axis-and-scale', title: 'Axis & Scale', paneComponent: AxisAndScalePane},
        {id: 'authoring-labels', title: 'Labels', paneComponent: LabelsPane},
        {id: 'authoring-flyouts', title: 'Flyouts', paneComponent: FlyoutsPane}
      ]
    };
  },

  propTypes: {
    vif: React.PropTypes.object
  },

  onComplete: function() {
    this.props.onComplete({
      vif: this.props.vif
    });
  },

  onCancel: function() {
    this.props.onCancel();
  },

  onTabNavigation: function(event) {
    var href = event.target.getAttribute('href');

    if (href) {
      event.preventDefault();
      this.setState({currentTabSelection: href.slice(1)});
    }
  },

  render: function() {
    return (
      <div className="modal modal-full modal-overlay" onKeyUp={this.onKeyUp}>
        <div className="modal-container">

          <header className="modal-header">
            <h5 className="modal-header-title">Create Visualization</h5>
            <button className="btn btn-transparent modal-header-dismiss" onClick={this.onCancel}>
              <span className="icon-close-2"></span>
            </button>
          </header>

          <section className="modal-content">
            <CustomizationTabs onTabNavigation={this.onTabNavigation} selection={this.state.currentTabSelection} tabs={this.props.tabs} />

            <div className="authoring-controls">
              <CustomizationTabPanes selection={this.state.currentTabSelection} tabs={this.props.tabs} />
              <Visualization {...this.props} />
            </div>
          </section>

          <footer className="modal-footer">
            <div className="modal-footer-actions">
              <button className="btn btn-default cancel" onClick={this.onCancel}>Cancel</button>
              <button className="btn btn-primary done" onClick={this.onComplete}>Insert</button>
            </div>
          </footer>
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    vif: state.vif
  };
}

function mapDispatchToProps() {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflow);
