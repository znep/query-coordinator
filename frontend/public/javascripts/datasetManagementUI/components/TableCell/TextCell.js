import PropTypes from 'prop-types';
import TypedCell from './TypedCell';
import React, { Component } from 'react';

class TextCell extends Component {
  render() {
    return <TypedCell {...this.props} />;
  }
}

TextCell.propTypes = {
  isDropping: PropTypes.bool,
  value: PropTypes.string,
  format: PropTypes.object
};

export default TextCell;
