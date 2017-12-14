import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDatePicker from 'react-datepicker';

import SocrataIcon from 'common/components/SocrataIcon';

/**
  Basic wrapper around react-datepicker and SocrataIcon.
  @prop date Should be in the format YYYY-MM-DD
  @prop onChangeDate calls back with YYYY-MM-DD format.
*/
export class DatePicker extends Component {
  render() {
    const { date, onChangeDate } = this.props;

    const datepickerProps = {
      className: 'text-input date-picker-input',
      dateFormatCalendar: 'MMMM YYYY',
      fixedHeight: true,
      selected: moment(date),
      onChange: (value) => {
        if (!value) return;
        onChangeDate(value.format('YYYY-MM-DD'));
      }
    };

    // react-datepicker does not accept an onKeyUp handler,
    // and Escape keys were causing undesireable effects
    // in container components (like closing modals).
    const onKeyUp = (event) => {
      if (event.key === 'Escape') {
        // Prevent ESCAPE from closing the modal unexpectantly
        event.preventDefault();
        event.stopPropagation();
      }
    };
    return (
      <div
        onKeyUp={onKeyUp}
        className="socrata-date-picker">
        <SocrataIcon name="date" />
        <ReactDatePicker {...datepickerProps} />
      </div>
    );
  }
}

DatePicker.propTypes = {
  date: PropTypes.string.isRequired,
  onChangeDate: PropTypes.func.isRequired
};

export default DatePicker;
