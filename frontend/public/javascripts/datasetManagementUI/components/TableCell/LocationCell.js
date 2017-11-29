import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TypedCell from './TypedCell';

class LocationCell extends Component {
  render() {
    const {
      latitude,
      longitude,
      human_address: ha
    } = this.props.value;

    const address = ha.address || '';
    const city = ha.city || '';
    const state = ha.state || '';
    const zip = ha.zip || '';

    const text = `${address} ${city} ${state} ${zip} (${latitude}, ${longitude})`.trim();

    return (<TypedCell value={text} format={this.props.format} />);
  }
}

LocationCell.propTypes = {
  value: PropTypes.string,
  format: PropTypes.object
};

export default LocationCell;
