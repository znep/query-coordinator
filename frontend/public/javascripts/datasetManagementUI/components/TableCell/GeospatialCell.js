import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TypedCell from './TypedCell';

class GeospatialCell extends Component {
  render() {
    const text = `${this.props.value.type}(...)`;
    return <TypedCell isDropping={this.props.isDropping} value={text} format={this.props.format} />;
  }
}

GeospatialCell.propTypes = {
  isDropping: PropTypes.bool,
  value: PropTypes.object,
  format: PropTypes.object
};

export default GeospatialCell;
