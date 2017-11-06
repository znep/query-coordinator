import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TypedCell from './TypedCell';
import geojson2wkt from 'geojson2wkt';

class GeospatialCell extends Component {
  render() {
    const text = geojson2wkt.convert(this.props.value);
    return <TypedCell isDropping={this.props.isDropping} value={text} format={this.props.format} />;
  }
}

GeospatialCell.propTypes = {
  isDropping: PropTypes.bool,
  value: PropTypes.string,
  format: PropTypes.object
};

export default GeospatialCell;
