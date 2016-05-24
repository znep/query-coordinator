import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

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
        $visualizationPreview.socrataSvgColumnChart(this.props.vif);
        break;
      case 'timelineChart':
        $visualizationPreview.socrataSvgTimelineChart(this.props.vif);
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
