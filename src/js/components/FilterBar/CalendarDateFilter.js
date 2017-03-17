import _ from 'lodash';
import React, { PropTypes } from 'react';
import DateRangePicker from '../DateRangePicker';
import FilterHeader from './FilterHeader';
import FilterFooter from './FilterFooter';
import { getDefaultFilterForColumn } from './filters';
import moment from 'moment';

export const CalendarDateFilter = React.createClass({

  propTypes: {
    filter: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired
  },

  getInitialState() {
    const { filter, column } = this.props;
    const values = _.defaultTo(filter.arguments, {
      start: column.rangeMin,
      end: column.rangeMax
    });
    const start = this.setDate(values.start);
    const end = this.setDate(values.end);

    return {
      value: { start, end }
    };
  },

  onDatePickerChange(newDateRange) {
    this.updateValueState(newDateRange);
  },

  setDate(date) {
    return moment(date).isValid() ? date : moment().format();
  },

  isValidRange(value) {
    return moment(value.start).isBefore(value.end);
  },

  updateValueState(newValue) {
    const start = this.setDate(newValue.start);
    const end = this.setDate(newValue.end);

    if (this.isValidRange(newValue)) {
      this.setState({
        value: { start, end }
      });
    }
  },

  shouldDisableApply() {
    const { filter } = this.props;
    const { value } = this.state;
    const initialValue = filter.arguments;

    return _.isEqual(initialValue, value);
  },

  clearFilter() {
    const { column } = this.props;
    const { rangeMin, rangeMax } = column;

    this.updateValueState({
      start: rangeMin,
      end: rangeMax
    });
  },

  updateFilter() {
    const { filter, onUpdate, column } = this.props;
    const { value } = this.state;

    if (_.isEqual(_.at(value, 'start', 'end'), _.at(column, 'rangeMin', 'rangeMax'))) {
      const { isHidden } = filter;
      onUpdate(_.merge({}, getDefaultFilterForColumn(column), { isHidden }));
    } else {
      onUpdate(_.merge({}, filter, {
        function: 'timeRange',
        arguments: value
      }));
    }
  },

  renderDateRangePicker() {
    const calendarDatePickerProps = {
      value: this.state.value,
      onChange: this.onDatePickerChange
    };
    return <DateRangePicker {...calendarDatePickerProps} />;
  },

  renderFilterFooter() {
    const { onCancel } = this.props;

    const filterFooterProps = {
      disableApplyFilter: this.shouldDisableApply(),
      onClickApply: this.updateFilter,
      onClickCancel: onCancel,
      onClickClear: this.clearFilter
    };

    return <FilterFooter {...filterFooterProps} />;
  },

  render() {
    const { column } = this.props;

    return (
      <div className="filter-controls calendar-date-filter">
        <div className="range-filter-container">
          <FilterHeader name={column.name} />
          {this.renderDateRangePicker()}
        </div>
        {this.renderFilterFooter()}
      </div>
    );
  }
});

export default CalendarDateFilter;
