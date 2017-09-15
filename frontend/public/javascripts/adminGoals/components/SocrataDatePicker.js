import PropTypes from 'prop-types';
import React from 'react';
import DatePicker from 'react-datepicker';

import 'react-datepicker/dist/react-datepicker.css';

export default class SocrataDatePicker extends React.Component {
  render() {
    return (
      <div className="datepicker-wrapper">
        <span className="icon-date"/>
        <DatePicker
          className="text-input datepicker-input"
          placeholderText={ this.props.placeholderText }
          selected={ this.props.selected }
          fixedHeight
          onChange={ this.props.onChange }/>
      </div>
    );
  }
}

SocrataDatePicker.propTypes = {
  onChange: PropTypes.func,
  selected: PropTypes.any,
  placeholderText: PropTypes.string
};
