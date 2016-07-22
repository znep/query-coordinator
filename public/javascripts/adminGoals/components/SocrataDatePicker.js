import React from 'react';
import DatePicker from 'react-datepicker';

export default class SocrataDatePicker extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="datepicker-wrapper">
        <span className="icon-date"/>
        <DatePicker
          className="text-input datepicker-input"
          placeholderText={ this.props.placeholderText }
          selected={ this.props.selected }
          onChange={ this.props.onChange }/>
      </div>
    );
  }
}

SocrataDatePicker.propTypes = {
  onChange: React.PropTypes.func,
  selected: React.PropTypes.any,
  placeholderText: React.PropTypes.string
};
