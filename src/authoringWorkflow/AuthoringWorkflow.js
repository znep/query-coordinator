import React from 'react';
import { connect } from 'react-redux';

import { translate } from './I18n';
import { getCurrentVif, isInsertableVisualization } from './selectors/vifAuthoring';

import CustomizationTabs from './CustomizationTabs';
import CustomizationTabPanes from './CustomizationTabPanes';
import Visualization from './Visualization';
import DataPane from './panes/DataPane';
import TitleAndDescriptionPane from './panes/TitleAndDescriptionPane';
import ColorsAndStylePane from './panes/ColorsAndStylePane';
import AxisAndScalePane from './panes/AxisAndScalePane';
import LegendsAndFlyoutsPane from './panes/LegendsAndFlyoutsPane';

export var AuthoringWorkflow = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    onCancel: React.PropTypes.func,
    tabs: React.PropTypes.array
  },

  getInitialState() {
    return {
      currentTabSelection: 'authoring-data'
    };
  },

  getDefaultProps() {
    return {
      tabs: [
        {
          id: 'authoring-data',
          title: translate('panes.data.title'),
          paneComponent: DataPane
        },
        {
          id: 'authoring-title-and-description',
          title: translate('panes.title_and_description.title'),
          paneComponent: TitleAndDescriptionPane
        },
        {
          id: 'authoring-colors-and-style',
          title: translate('panes.colors_and_style.title'),
          paneComponent: ColorsAndStylePane
        },
        {
          id: 'authoring-axis-and-scale',
          title: translate('panes.axis_and_scale.title'),
          paneComponent: AxisAndScalePane
        },
        {
          id: 'authoring-legends-and-flyouts',
          title: translate('panes.legends_and_flyouts.title'),
          paneComponent: LegendsAndFlyoutsPane
        }
      ]
    };
  },

  onComplete() {
    this.props.onComplete({
      vif: this.props.vif
    });
  },

  onCancel() {
    this.props.onCancel();
  },

  onTabNavigation(event) {
    var href = event.target.getAttribute('href');

    if (href) {
      event.preventDefault();
      this.setState({currentTabSelection: href.slice(1)});
    }
  },

  render() {
    var vifAuthoring = this.props.vifAuthoring;
    var isNotInsertable = !isInsertableVisualization(vifAuthoring);

    return (
      <div className="modal modal-full modal-overlay" onKeyUp={this.onKeyUp}>
        <div className="modal-container">

          <header className="modal-header">
            <h5 className="modal-header-title">{translate('modal.title')}</h5>
            <button className="btn btn-transparent modal-header-dismiss" onClick={this.onCancel}>
              <span className="icon-close-2"></span>
            </button>
          </header>

          <section className="modal-content">
            <CustomizationTabs onTabNavigation={this.onTabNavigation} selection={this.state.currentTabSelection} tabs={this.props.tabs} />

            <div className="authoring-controls">
              <CustomizationTabPanes selection={this.state.currentTabSelection} tabs={this.props.tabs} />
              <Visualization />
            </div>
          </section>

          <footer className="modal-footer">
            <div className="modal-footer-actions">
              <button className="btn btn-default cancel" onClick={this.onCancel}>{translate('modal.close')}</button>
              <button className="btn btn-primary done" onClick={this.onComplete} disabled={isNotInsertable}>{translate('modal.insert')}</button>
            </div>
          </footer>
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    vif: getCurrentVif(state.vifAuthoring),
    vifAuthoring: state.vifAuthoring
  };
}

function mapDispatchToProps() {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflow);
