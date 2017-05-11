import React, { PropTypes } from 'react';

import VisualizationRenderer from '../VisualizationRenderer';

export default React.createClass({
  propTypes: {
    vif: PropTypes.object.isRequired
  },

  componentDidMount() {
    // this.props.options contains localization information passed in from DatasetPreview
    // as temporary way localize the Table & Pager components until the mono-repo is complete.
    this.visualization = new VisualizationRenderer(this.props.vif, this.element, this.props.options);
  },

  componentDidUpdate() {
    this.visualization.update(this.props.vif);
  },

  componentWillUnmount() {
    this.visualization.destroy();
  },

  render() {
    return <div ref={(el) => this.element = el} />;
  }
});
