import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TypedCell from './TypedCell';

class PointCell extends Component {
  render() {
    const [x, y] = this.props.value.coordinates;
    const text = `${this.props.value.type}(${x}, ${y})`;
    return <TypedCell isDropping={this.props.isDropping} value={text} format={this.props.format} />;
  }
}

PointCell.propTypes = {
  isDropping: PropTypes.bool,
  value: PropTypes.object,
  format: PropTypes.object
};

export default PointCell;
