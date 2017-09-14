import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import SocrataIcon from '../SocrataIcon';
import { formatToInclusiveSoqlDateRange } from 'common/dates';

export class DateRangePicker extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onChangeStartDate',
      'onChangeEndDate',
      'renderDatePickerStart',
      'renderDatePickerEnd'
    ]);
  }

  onChangeStartDate(date) {
    const { value, onChange } = this.props;

    const formattedDateRange = formatToInclusiveSoqlDateRange({
      start: date || value.start,
      end: value.end
    });

    onChange(formattedDateRange);
  }

  onChangeEndDate(date) {
    const { value, onChange } = this.props;

    const formattedDateRange = formatToInclusiveSoqlDateRange({
      start: value.start,
      end: date || value.end
    });
    onChange(formattedDateRange);
  }

  renderDatePickerStart(startDate, endDate) {
    const props = {
      fixedHeight: true,
      className: 'text-input date-picker-input start',
      selected: startDate,
      dateFormatCalendar: 'MM-DD-YYYY',
      selectsStart: true,
      startDate,
      endDate,
      onChange: this.onChangeStartDate
    };

    return (
      <div className="date-range-picker-start">
        <SocrataIcon name="date" />
        <DatePicker {...props} />
      </div>
    );
  }

  renderDatePickerEnd(startDate, endDate) {
    const props = {
      fixedHeight: true,
      className: 'text-input date-picker-input end',
      selected: endDate,
      dateFormatCalendar: 'MM-DD-YYYY',
      selectsEnd: true,
      startDate,
      endDate,
      onChange: this.onChangeEndDate
    };

    return (
      <div className="date-range-picker-end">
        <SocrataIcon name="date" />
        <DatePicker {...props} />
      </div>
    );
  }

  render() {
    // The third party library requires moment objects
    const startDate = moment(this.props.value.start);
    const endDate = moment(this.props.value.end);

    return (
      <div className="date-range-picker">
        {this.renderDatePickerStart(startDate, endDate)}
        <span className="range-separator">-</span>
        {this.renderDatePickerEnd(startDate, endDate)}
      </div>
    );
  }
}

DateRangePicker.propTypes = {
  /**
  * Contains two values:
  * start: default value used as startDate
  * end: default value used as endDate
  */
  value: PropTypes.shape({
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired
  }),

  /**
  * The onChange handler is fired when a date is selected in the calendar
  */
  onChange: PropTypes.func.isRequired
};

export default DateRangePicker;
