import PropTypes from 'prop-types';
import React, { Component } from 'react';
import $ from 'jquery';

export class PointSizePreview extends Component {
  render() {
    const { pointSize } = this.props;
    const pointStyle = {
      'width': 2 * pointSize + 'px',
      'height': 2 * pointSize + 'px'
    };

    return (
      <div className="point-size-preview-container" role="presentation" aria-hidden="true">
        <svg className="point-preview-indicator" viewBox="0 0 2 2" style={pointStyle}>
          <circle cx="1" cy="1" r="1" />
        </svg>
      </div>
    );
  }
}

PointSizePreview.propTypes = {
  pointSize: PropTypes.number.isRequired
};

export default PointSizePreview;
