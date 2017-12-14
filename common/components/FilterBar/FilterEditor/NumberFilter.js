import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { focusFirstActionableElement } from 'common/a11y';
import I18n from 'common/i18n';
import { ENTER, isolateEventByKeys } from 'common/dom_helpers/keycodes_deprecated';
import { getPrecision, roundToPrecision } from 'common/numbers';

import Dropdown from '../../Dropdown';
import FilterHeader from '../FilterHeader';
import FilterFooter from '../FilterFooter';
import { getDefaultFilterForColumn } from '../filters';

const requiresRange = (func) => _.includes(['rangeInclusive', 'rangeExclusive'], func);

// sort-comp doesn't know how to deal with the function autobinding syntax:
// {
//   foo = () => {}
// }
/* eslint-disable react/sort-comp */

// For some reason this lint check is firing here, even though
// the render method absolutely has a return statement.
// eslint-disable-next-line react/require-render-return
class NumberFilter extends Component {
  constructor(props) {
    super(props);

    this.state = this.getInitialState();
  }

  getInitialState = () => {
    const { column } = this.props;
    let { filter } = this.props;

    // This function is deprecated. See its entry in VIF.md.
    if (filter.function === 'valueRange') {
      // valueRange pretends to be a rangeInclusive, but it isn't actually (it's half inclusive, half exclusive).
      // However, the UI strongly suggests to the user that it's properly rangeInclusive. So, make that a reality
      // here.
      const step = _.min(_.map([column.rangeMin, column.rangeMax], getPrecision));
      // The result of this computation is what we show the user. It is reasonable
      // for them to assume we actually use the number we display as the end point (which
      // we don't, for valueRange).
      const fudgedEnd = roundToPrecision(
        _.get(filter, 'arguments.end', column.rangeMax),
        step
      );

      filter = {
        function: 'rangeInclusive',
        columnName: filter.columnName,
        arguments: {
          start: _.toString(filter.arguments.start),
          end: _.toString(fudgedEnd)
        }
      };

      if (_.has(this.props.filter.arguments, 'includeNullValues')) {
        filter.arguments.includeNullValues = this.props.filter.arguments.includeNullValues;
      }

    }

    return {
      filter
    };
  }

  componentDidMount = () => {
    focusFirstActionableElement(ReactDOM.findDOMNode(this), '.config-btn');
  }

  defaultArgumentsForFunction = (func) => {
    const { column } = this.props;
    return requiresRange(func) ?
      {
        start: _.toString(column.rangeMin),
        end: _.toString(column.rangeMax)
      } :
      { value: _.toString(column.rangeMin) };
  }

  onDropdownChange = (newValue) => {
    const { column } = this.props;
    const nowRequiresRange = requiresRange(newValue);
    const didRequireRange = requiresRange(this.state.filter.function);

    let newState = _.cloneDeep(this.state);
    newState.filter = {
      ...this.state.filter,
      function: newValue.value
    };

    if (nowRequiresRange && didRequireRange) {
      newState.filter.arguments = this.state.filter.arguments;
    } else {
      newState.filter.arguments = this.defaultArgumentsForFunction(newValue.value);
    }

    _.set(
      newState, 'filter.arguments.includeNullValues',
      _.get(this.state, 'filter.arguments.includeNullValues', true)
    );

    this.setState(newState);
  }

  onCheckboxChange = (event) => {
    const newState = _.cloneDeep(this.state);
    _.set(newState, 'filter.arguments.includeNullValues', event.target.checked);
    this.setState(newState);
  }

  shouldDisableApply = () => {
    return _.isEqual(this.state.filter, this.props.filter);
  }

  applyFilter = () => {
    const { onUpdate } = this.props;
    const { filter } = this.state;

    // Swap the start and end if necessary to ensure the range is valid
    let { start, end } = filter.arguments || {};
    if (start > end) {
      filter.arguments = {
        start: filter.arguments.end,
        end: filter.arguments.start
      };
    }

    onUpdate(filter);
  }

  applyOnEnter = (event) => {
    isolateEventByKeys(event, [ENTER]);

    if (event.keyCode === ENTER && !this.shouldDisableApply()) {
      this.applyFilter();
    }
  }

  getStepInterval = () => {
    const { rangeMin, rangeMax } = this.props.column;

    return _.min(_.map([rangeMin, rangeMax], getPrecision));
  }

  resetFilter = () => {
    const newFilter = _.cloneDeep(getDefaultFilterForColumn(this.props.column));
    newFilter.isHidden = this.state.filter.isHidden;
    this.setState({
      filter: newFilter
    });
  }

  renderRangeInputFields = () => {
    const setArgument = (argument, value) => {
      const newState = _.cloneDeep(this.state);
      _.set(newState, ['filter', 'arguments', argument], value); // String.
      this.setState(newState);
    };

    const inputProps = {
      className: 'range-input text-input',
      type: 'number',
      step: this.getStepInterval(),
      onKeyUp: this.applyOnEnter
    };

    const { column } = this.props;
    const start = _.get(this.state, 'filter.arguments.start', column.rangeMin);
    const end = _.get(this.state, 'filter.arguments.end', column.rangeMax);

    return (
      <div className="range-text-inputs-container input-group">
        <input
          id="start"
          value={start}
          onChange={(event) => { setArgument('start', event.target.value); }}
          aria-label={I18n.t('shared.components.filter_bar.from')}
          placeholder={I18n.t('shared.components.filter_bar.from')}
          {...inputProps} />
        <span className="range-separator">-</span>
        <input
          id="end"
          value={end}
          onChange={(event) => { setArgument('end', event.target.value); }}
          aria-label={I18n.t('shared.components.filter_bar.to')}
          placeholder={I18n.t('shared.components.filter_bar.to')}
          {...inputProps} />
      </div>
    );
  }

  renderSingleInputField = () => {
    const value = _.get(this.state, 'filter.arguments.value', this.props.column.rangeMin);

    const inputProps = {
      'aria-label': I18n.t('shared.components.filter_bar.range_filter.value'),
      className: 'range-input text-input',
      id: 'value',
      onKeyUp: this.applyOnEnter,
      placeholder: I18n.t('shared.components.filter_bar.range_filter.value'),
      step: this.getStepInterval(),
      type: 'number',
      value,
      onChange: (event) => {
        this.setState(_.set(
          _.cloneDeep(this.state),
          'filter.arguments.value',
          event.target.value // String.
        ));
      }
    };

    return (
      <div className="range-text-inputs-container input-group">
        <input {...inputProps} />
      </div>
    );

  }

  renderInputFields = () => {
    const filterFunction = this.state.filter.function;
    if (filterFunction === 'noop' || !filterFunction) { return null; }

    return requiresRange(this.state.filter.function) ?
      this.renderRangeInputFields() :
      this.renderSingleInputField();
  }

  renderDropdown = () => {

    const props = {
      value: this.state.filter.function,
      onSelection: this.onDropdownChange,
      options: [
        { title: I18n.t('shared.components.filter_bar.range_filter.operators.<'), value: '<' },
        { title: I18n.t('shared.components.filter_bar.range_filter.operators.<='), value: '<=' },
        { title: I18n.t('shared.components.filter_bar.range_filter.operators.>'), value: '>' },
        { title: I18n.t('shared.components.filter_bar.range_filter.operators.>='), value: '>=' },
        {
          title: I18n.t('shared.components.filter_bar.range_filter.operators.range_exclusive'),
          value: 'rangeExclusive'
        },
        {
          title: I18n.t('shared.components.filter_bar.range_filter.operators.range_inclusive'),
          value: 'rangeInclusive'
        }
      ]
    };
    return <Dropdown {...props} />;
  }

  renderNullValueCheckbox = () => {
    if (this.props.hideNullValueCheckbox) {
      return null;
    }

    const defaultChecked = _.get(this.state, 'filter.arguments.includeNullValues', true);
    const nullToggleId = _.uniqueId('include-nulls-');
    const inputAttributes = {
      id: nullToggleId,
      className: 'include-nulls-toggle',
      type: 'checkbox',
      onChange: this.onCheckboxChange,
      defaultChecked
    };

    return (
      <div className="checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor={nullToggleId}>
          <span className="fake-checkbox">
            <span className="icon-checkmark3" />
          </span>
          {I18n.t('shared.components.filter_bar.range_filter.include_null_values')}
        </label>
      </div>
    );
  }

  render = () => {
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
      onClickApply: this.applyFilter,
      onClickRemove: onRemove,
      onClickReset: this.resetFilter
    };

    return (
      <div className="filter-controls number-filter">
        <div className="range-filter-container">
          {header}
          {this.renderDropdown()}
          {this.renderInputFields()}
          {this.renderNullValueCheckbox()}
        </div>
        <FilterFooter {...footerProps} />
      </div>
    );
  }
}

NumberFilter.propTypes = {
  filter: PropTypes.object.isRequired,
  column: PropTypes.shape({
    rangeMin: PropTypes.number.isRequired,
    rangeMax: PropTypes.number.isRequired
  }),
  header: PropTypes.element,
  isReadOnly: PropTypes.bool,
  onClickConfig: PropTypes.func,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default NumberFilter;
