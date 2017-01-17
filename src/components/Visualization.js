import React, { PropTypes } from 'react';

import VisualizationRenderer from '../VisualizationRenderer';

export default React.createClass({
  propTypes: {
    vif: PropTypes.object.isRequired
  },

  componentDidMount() {
    this.visualization = new VisualizationRenderer(this.props.vif, this.element);
  },

  componentDidUpdate() {
    this.visualization.update(this.props.vif);
  },

  componentWillUnMount() {
    this.visualization.destroy();
  },

  render() {
    return <div ref={(el) => this.element = el} />;
  }
});
