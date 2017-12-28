import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class LineWeightPreview extends Component {
  render() {
    const { lineWeight } = this.props;
    const lineStyle = { 'width': lineWeight + 'px' };

    return (
      <div className="line-weight-preview-container" role="presentation" aria-hidden="true">
        <span className="line-preview-indicator" style={lineStyle}></span>
      </div>
    );
  }
}

LineWeightPreview.propTypes = {
  lineWeight: PropTypes.number.isRequired
};

export default LineWeightPreview;
