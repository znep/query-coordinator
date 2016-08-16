import React from 'react';
import _ from 'lodash';
import $ from 'jquery';
import { connect } from 'react-redux';

import { translate } from '../../I18n';
import { setXAxisScalingMode } from '../actions';

import {
  getCurrentVif,
  getXAxisScalingMode,
  isInsertableVisualization
} from '../selectors/vifAuthoring';

import CustomizationTabs from './CustomizationTabs';
import CustomizationTabPanes from './CustomizationTabPanes';
import Visualization from './Visualization';
import TableView from './TableView';
import DataPane from './panes/DataPane';
import TitleAndDescriptionPane from './panes/TitleAndDescriptionPane';
import ColorsAndStylePane from './panes/ColorsAndStylePane';
import AxisAndScalePane from './panes/AxisAndScalePane';
import LegendsAndFlyoutsPane from './panes/LegendsAndFlyoutsPane';


import FlyoutRenderer from '../../views/FlyoutRenderer';
import RowInspector from '../../views/RowInspector';

export var AuthoringWorkflow = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    onComplete: React.PropTypes.func,
    onBack: React.PropTypes.func,
    onCancel: React.PropTypes.func,
    tabs: React.PropTypes.array
  },

  getInitialState() {
    return {
      currentTabSelection: 'authoring-data',
      flyoutRenderer: null
    };
  },

  getDefaultProps() {
    return {
      onComplete: _.noop,
      onBack: _.noop,
      onCancel: _.noop,
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

  componentDidMount() {
    this.setState({
      flyoutRenderer: new FlyoutRenderer()
    });

    RowInspector.setup();

    // Prevents the form from submitting and refreshing the page.
    $(this.modal).
      on('submit', _.constant(false)).
      on('SOCRATA_VISUALIZATION_FLYOUT', this.onFlyout);
  },

  componentWillUnmount() {
    $(this.modal).off('SOCRATA_VISUALIZATION_FLYOUT', this.onFlyout);
  },

  onFlyout(event) {
    var payload = event.originalEvent.detail;

    // Render/hide a flyout
    if (payload !== null) {
      this.state.flyoutRenderer.render(payload);
    } else {
      this.state.flyoutRenderer.clear();
    }
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

  scalingMode() {
    var checkboxAttributes = {
      type: 'checkbox',
      onChange: this.props.onChangeXAxisScalingMode,
      checked: getXAxisScalingMode(this.props.vifAuthoring) === 'fit',
      id: 'x-axis-scaling-mode'
    };

    return (
      <form className="x-axis-scaling-mode-container">
        <div className="checkbox">
          <input {...checkboxAttributes} />
          <label htmlFor="x-axis-scaling-mode">
            <span className="fake-checkbox">
              <span className="icon-checkmark3"></span>
            </span>
            {translate('panes.axis_and_scale.fields.x_axis_scaling_mode.title')}
          </label>
        </div>
      </form>
    );
  },

  renderBackButton() {
    var { backButtonText, onBack } = this.props;

      return _.isString(backButtonText) ? (
        <button className="authoring-back-button" onClick={onBack}>
          <span className="icon-arrow-left" />
          {backButtonText}
        </button>
      ) : null;
  },

  render() {
    var { metadata, vifAuthoring } = this.props;
    var isNotInsertable = !isInsertableVisualization(vifAuthoring);
    var scalingMode = null; // This feature is hidden for now.

    return (
      <div className="authoring-modal modal modal-full modal-overlay" onKeyUp={this.onKeyUp} ref={(ref) => this.modal = ref}>
        <div className="modal-container">

          <header className="modal-header">
            <h5 className="modal-header-title">{translate('modal.title')}</h5>
            <button className="btn btn-transparent modal-header-dismiss" onClick={this.onCancel}>
              <span className="icon-close-2"></span>
            </button>
          </header>

          <section className="authoring-modal-content modal-content">
            <CustomizationTabs onTabNavigation={this.onTabNavigation} selection={this.state.currentTabSelection} tabs={this.props.tabs} />

            <div className="authoring-controls">
              <CustomizationTabPanes selection={this.state.currentTabSelection} tabs={this.props.tabs} />
              <div className="authoring-preview-container">
                <Visualization />
                {scalingMode}
              </div>
            </div>

            <TableView />
          </section>

          <footer className="modal-footer authoring-modal-footer">
            <div className="modal-footer-actions">
              {this.renderBackButton()}
              <div className="authoring-actions">
                <button className="btn btn-sm btn-default cancel" onClick={this.onCancel}>{translate('modal.close')}</button>
                <button className="btn btn-sm btn-primary done" onClick={this.onComplete} disabled={isNotInsertable}>{translate('modal.insert')}</button>
              </div>
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
    vifAuthoring: state.vifAuthoring,
    metadata: state.metadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeXAxisScalingMode(event) {
      var xAxisScalingMode = event.target.checked;
      dispatch(setXAxisScalingMode(xAxisScalingMode));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflow);
