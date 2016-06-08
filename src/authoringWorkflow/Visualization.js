import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import RowInspector from '../views/RowInspector';
import FlyoutRenderer from '../views/FlyoutRenderer';

import {
  isValidTimelineChartVif,
  isValidFeatureMapVif,
  isValidColumnChartVif,
  isValidChoroplethMapVif,
  getCurrentVif
} from './selectors/vifAuthoring';

export var Visualization = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object
  },

  getInitialState: function() {
    return {
      flyoutRenderer: null
    };
  },

  componentDidMount: function() {
    this.setState({
      flyoutRenderer: new FlyoutRenderer()
    });

    RowInspector.setup();
    this.renderVisualization();
  },

  componentDidUpdate: function() {
    this.renderVisualization();
  },

  shouldComponentUpdate: function(nextProps) {
    return !_.isEqual(this.props.vif, nextProps.vif);
  },

  onFlyout: function(event) {
    var payload = event.originalEvent.detail;

    // Render/hide a flyout
    if (payload !== null) {
      this.state.flyoutRenderer.render(payload);
    } else {
      this.state.flyoutRenderer.clear();
    }
  },

  renderVisualization: function() {
    var self = this;
    var onFlyout = event => this.onFlyout(event);
    var chartType = _.get(self.props.vif, 'series[0].type', null);
    var $visualizationPreview = $(ReactDOM.findDOMNode(self)).
      find('.visualization-preview');

    $visualizationPreview.
      trigger('SOCRATA_VISUALIZATION_DESTROY').
      off('SOCRATA_VISUALIZATION_FLYOUT').
      off('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT').
      off('SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT');

    switch (chartType) {
      case 'columnChart':
        if (isValidColumnChartVif(self.props.vifAuthoring)) {
          $visualizationPreview.socrataSvgColumnChart(self.props.vif);
          $visualizationPreview.on('SOCRATA_VISUALIZATION_FLYOUT', onFlyout);
        }
        break;
      case 'timelineChart':
        if (isValidTimelineChartVif(self.props.vifAuthoring)) {
          $visualizationPreview.socrataSvgTimelineChart(self.props.vif);
          $visualizationPreview.on('SOCRATA_VISUALIZATION_FLYOUT', onFlyout);
        }
        break;
      case 'featureMap':
        if (isValidFeatureMapVif(self.props.vifAuthoring)) {
          $visualizationPreview.socrataFeatureMap(self.props.vif);
          $visualizationPreview.on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', onFlyout);
        }
        break;
      case 'choroplethMap':
        if (isValidChoroplethMapVif(self.props.vifAuthoring)) {
          $visualizationPreview.socrataChoroplethMap(self.props.vif);
          $visualizationPreview.on('SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT', onFlyout);
        }
        break;
    }
  },

  render: function() {
    return (
      <div className="visualization-preview-container">
        <div className="visualization-toggler">
          <small>Visualization</small>
        </div>
        <div className="visualization-preview"></div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring,
    vif: getCurrentVif(state.vifAuthoring)
  };
}

function mapDispatchToProps() {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Visualization);
