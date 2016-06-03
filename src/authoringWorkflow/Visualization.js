import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import { isValidTimelineChartVif, isValidFeatureMapVif, isValidColumnChartVif, getCurrentVif } from './selectors/vifAuthoring';

export var Visualization = React.createClass({
  componentDidMount: function() {
    this.renderVisualization();
  },

  componentDidUpdate: function() {
    this.renderVisualization();
  },

  shouldComponentUpdate: function(nextProps) {
    return !_.isEqual(this.props.vif, nextProps.vif);
  },

  renderVisualization: function() {
    var chartType = _.get(this.props.vif, 'series[0].type', null);
    var $visualizationPreview = $(ReactDOM.findDOMNode(this)).
      find('.visualization-preview');

    $visualizationPreview.
      trigger('SOCRATA_VISUALIZATION_DESTROY');

    switch (chartType) {
      case 'columnChart':
        if (isValidColumnChartVif(this.props.vifAuthoring)) {
          $visualizationPreview.socrataSvgColumnChart(this.props.vif);
        }

        break;
      case 'timelineChart':
        if (isValidTimelineChartVif(this.props.vifAuthoring)) {
          $visualizationPreview.socrataSvgTimelineChart(this.props.vif);
        }

        break;
      case 'featureMap':
        if (isValidFeatureMapVif(this.props.vifAuthoring)) {
          $visualizationPreview.socrataFeatureMap(this.props.vif);
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
