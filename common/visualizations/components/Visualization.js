import PropTypes from 'prop-types';
import React, { Component } from 'react';

import VisualizationRenderer from '../VisualizationRenderer';

class Visualization extends Component {
  componentDidMount() {
    // this.props.options contains localization information passed in from DatasetPreview
    // as temporary way localize the Table & Pager components until the mono-repo is complete.
    this.visualization = new VisualizationRenderer(this.props.vif, this.element, this.props.options);
  }

  componentDidUpdate() {
    this.visualization.update(this.props.vif);
  }

  componentWillUnmount() {
    this.visualization.destroy();
  }

  render() {
    return <div ref={(el) => this.element = el} />;
  }
}

Visualization.propTypes = {
  vif: PropTypes.object.isRequired
};

export default Visualization;
