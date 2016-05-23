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
    var $visualization = $(ReactDOM.findDOMNode(this));

    $visualization.
      trigger('SOCRATA_VISUALIZATION_DESTROY').
      empty();

    switch (chartType) {
      case 'columnChart':
        $visualization.socrataSvgColumnChart(this.props.vif);
        break;
      case 'timelineChart':
        $visualization.socrataSvgTimelineChart(this.props.vif);
        break;
    }
  },

  render: function() {
    return <div className="authoring-workflow-visualization-preview"></div>;
  }
});
