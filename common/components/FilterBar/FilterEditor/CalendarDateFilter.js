import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { ENTER, isolateEventByKeys } from 'common/dom_helpers/keycodes_deprecated';

import DateRangePicker from '../../DateRangePicker';
import FilterHeader from '../FilterHeader';
import FilterFooter from '../FilterFooter';
import { getDefaultFilterForColumn } from '../filters';

class CalendarDateFilter extends Component {
  constructor(props) {
    super(props);

    const { filter, column } = props;
    const values = _.defaultTo(filter.arguments, {
      start: column.rangeMin,
      end: column.rangeMax
    });
    const start = this.setDate(values.start);
    const end = this.setDate(values.end);

    _.bindAll(this, [
      'getInitialState',
      'onDatePickerChange',
      'onEnterUpdateFilter',
      'setDate',
      'isValidRange',
      'updateValueState',
      'shouldDisableApply',
      'resetFilter',
      'updateFilter',
      'renderDateRangePicker'
    ]);

    this.state = this.getInitialState();
  }

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
  }

  componentDidMount() {
    if (this.dateFilter) {
      this.inputs = this.dateFilter.querySelectorAll('.date-picker-input');
      _.each(this.inputs, (input) => input.addEventListener('keyup', this.onEnterUpdateFilter));
    }
  }

  componentWillUnmount() {
    if (this.inputs) {
      _.each(this.inputs, (input) => input.removeEventListener('keyup', this.onEnterUpdateFilter));
    }
  }

  onDatePickerChange(newDateRange) {
    this.updateValueState(newDateRange);
  }

  onEnterUpdateFilter(event) {
    isolateEventByKeys(event, [ENTER]);

    if (event.keyCode === ENTER && !this.shouldDisableApply()) {
      this.updateFilter();
    }
  }

  setDate(date) {
    // Checking if undefined because;
    //   moment(null).isValid() === false
    //   moment(undefined).isValid() === true
    return !_.isUndefined(date) && moment(date).isValid() ?
      // Getting default date without time to be able to compare
      // and find out if we should disable apply button.
      date : moment().format('YYYY-MM-DD');
  }

  isValidRange(value) {
    return moment(value.start).isBefore(value.end);
  }

  updateValueState(newValue) {
    const start = this.setDate(newValue.start);
    const end = this.setDate(newValue.end);

    if (this.isValidRange(newValue)) {
      this.setState({
        value: { start, end }
      });
    }
  }

  shouldDisableApply() {
    const { value } = this.state;
    // We need to compare the filter returned by getInitialState to disable the apply button on
    // first load. We manipulate the filter's values in getInitialState to be slightly different
    // than the filter passed into the prop when the filter is first added.
    const initialValue = this.getInitialState().value;

    return _.isEqual(initialValue, value);
  }

  resetFilter() {
    const { column } = this.props;
    const { rangeMin, rangeMax } = column;

    // Not using updateValueState here because start & end dates might be same.
    // updateValueState checks if end is later then start.
    this.setState({
      value: {
        start: this.setDate(rangeMin),
        end: this.setDate(rangeMax)
      }
    });

    if (typeof this.props.onClear === 'function') {
      this.props.onClear();
    }
  }

  updateFilter() {
    const { filter, onUpdate, column } = this.props;
    const { value } = this.state;

    if (_.isEqual(_.at(value, 'start', 'end'), _.at(column, 'rangeMin', 'rangeMax'))) {
      const { isHidden } = filter;
      onUpdate(_.merge({}, getDefaultFilterForColumn(column), { isHidden }));
    } else {
      onUpdate(_.merge({}, filter, {
        'function': 'timeRange',
        arguments: value
      }));
    }
  }

  renderDateRangePicker() {
    const calendarDatePickerProps = {
      value: this.state.value,
      onChange: this.onDatePickerChange
    };
    return <DateRangePicker {...calendarDatePickerProps} />;
  }

  render() {
    const { column, isReadOnly, onClickConfig, onRemove } = this.props;

    let header = this.props.header;
    if (!header) {
      const headerProps = {
        name: column.name,
        isReadOnly,
        onClickConfig
      };
      header = <FilterHeader {...headerProps} />;
    }

    const footerProps = {
      disableApplyFilter: this.shouldDisableApply(),
      isReadOnly,
      onClickApply: this.updateFilter,
      onClickRemove: onRemove,
      onClickReset: this.resetFilter
    };

    return (
      <div className="filter-controls calendar-date-filter" ref={(el) => this.dateFilter = el}>
        <div className="range-filter-container">
          {header}
          {this.renderDateRangePicker()}
        </div>
        <FilterFooter {...footerProps} />
      </div>
    );
  }
}

CalendarDateFilter.propTypes = {
  column: PropTypes.object.isRequired,
  filter: PropTypes.object.isRequired,
  header: PropTypes.element,
  isReadOnly: PropTypes.bool,
  onClear: PropTypes.func,
  onClickConfig: PropTypes.func,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default CalendarDateFilter;
