import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TypedCell from './TypedCell';

class LocationCell extends Component {
  render() {
    const { latitude, longitude } = this.props.value;
    const text = `Location(${latitude}, ${longitude})`;

    return (<TypedCell value={text} format={this.props.format} />);
  }
}

LocationCell.propTypes = {
  value: PropTypes.string,
  format: PropTypes.object
};

export default LocationCell;
