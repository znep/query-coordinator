import React from 'react';
import DayPicker from 'react-day-picker'; // eslint-disable-line no-unused-vars
import moment from 'moment';
import './DayPicker.scss';

class MonthCalendar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedDay: this.props.initialDate || new Date(),
      initialMonth: this.props.initialDate,
      value: moment(this.props.initialDate).format('L')
    };
  }

  handleDayClick(e, day) {
    this.setState({
      selectedDay: day,
      value: moment(day).format('L')
    }, this.updateParent);
  }

  handleInputChange(e) {
    var {value} = e.target;
    var month = this.state.selectedDay;
    var validDate = moment(value, 'L', true).isValid();
    if (validDate) {
      month = moment(value, 'L').toDate();
    }

    this.setState({
      selectedDay: month,
      value: value
    }, this.showCurrentDate);
  }

  showCurrentDate() {
    this.refs.daypicker.showMonth(this.state.selectedDay);
    this.updateParent();
  }

  updateParent() {
    var date = moment(this.state.selectedDay).format('L');
    if (this.props.handleChange && moment(date).isValid()) {
      this.props.handleChange(date);
    }
  }

  isSameDay(day1, day2) {
    day1.setHours(0, 0, 0, 0);
    day2.setHours(0, 0, 0, 0);
    return day1.getTime() === day2.getTime();
  }

  render() {
    var {selectedDay} = this.state;
    var modifiers;

    if (selectedDay) {
      modifiers = {
        'selected': (day) => this.isSameDay(selectedDay, day)
      };
    }

    return (
      <div className="day-picker">
        <DayPicker
          ref="daypicker"
          initialMonth={this.state.initialMonth}
          numberOfMonths={this.props.numberOfMonths}
          modifiers={modifiers}
          onDayClick={this.handleDayClick.bind(this)}
          enableOutsideDays={true}
        />
        <input
          ref="input"
          type="text"
          className={'dateInput'}
          value={this.state.value}
          placeholder="MM/DD/YYYY"
          onChange={this.handleInputChange.bind(this)}
           />
      </div>
    );
  }
}

MonthCalendar.propTypes = {
  numberOfMonths: React.PropTypes.number,
  switcher: React.PropTypes.bool,
  switchLabel: React.PropTypes.string,
  disable: React.PropTypes.bool,
  handleChange: React.PropTypes.func
};

MonthCalendar.defaultProps = {
  numberOfMonths: 1,
  switcher: false,
  switchLabel: 'Enable/Disable',
  disable: false
};

export default MonthCalendar;
