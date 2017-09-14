import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import Slider from '../Slider';
import FilterHeader from './FilterHeader';
import FilterFooter from './FilterFooter';
import I18n from 'common/i18n';
import { ENTER, isolateEventByKeys } from 'common/keycodes';
import { getPrecision, roundToPrecision } from 'common/numbers';
import { getDefaultFilterForColumn } from './filters';

class NumberFilter extends Component {
  constructor(props) {
    super(props);

    const { column, filter } = props;

    _.bindAll(this, [
      'getInitialState',
      'onInputChange',
      'onKeyUp',
      'onSliderChange',
      'onCheckboxChange',
      'getStepInterval',
      'updateValueState',
      'shouldDisableApply',
      'resetFilter',
      'updateFilter',
      'renderInputFields',
      'renderSlider',
      'renderNullValueCheckbox'
    ]);

    this.state = this.getInitialState();
  }

  getInitialState() {
    const { column, filter } = this.props;

    return {
      value: _.defaults(filter.arguments, {
        start: column.rangeMin,
        end: column.rangeMax,
        includeNullValues: true
      })
    };
  }

  componentDidMount() {
    if (this.firstInput) {
      this.firstInput.focus();
    }
  }

  onInputChange({ target }) {
    this.updateValueState({
      [target.id]: _.toNumber(target.value)
    });
  }

  onKeyUp(event) {
    isolateEventByKeys(event, [ENTER]);

    if (event.keyCode === ENTER && !this.shouldDisableApply()) {
      this.updateFilter();
    }
  }

  onSliderChange(newValue) {
    this.updateValueState(newValue);
  }

  onCheckboxChange(event) {
    this.updateValueState({
      includeNullValues: event.target.checked
    });
  }

  getStepInterval() {
    const { rangeMin, rangeMax } = this.props.column;

    return _.min(_.map([rangeMin, rangeMax], getPrecision));
  }

  updateValueState(updates) {
    this.setState({
      value: {
        ...this.state.value,
        ...updates
      }
    });
  }

  shouldDisableApply() {
    const { value } = this.state;

    return _.isEqual(value, this.getInitialState().value);
  }

  resetFilter() {
    const { rangeMin, rangeMax } = this.props.column;

    this.updateValueState({
      start: rangeMin,
      end: rangeMax,
      includeNullValues: true
    });
  }

  updateFilter() {
    const { column, filter, onUpdate } = this.props;
    const { value } = this.state;

    // Swap the start and end if necessary to ensure the range is valid
    let { start, end, includeNullValues } = value;
    if (start > end) {
      [start, end] = [end, start];
    }

    // Add a small amount to the end of the interval (computed based on precision) to
    // fake a range that is inclusive on both ends.  The real fix is to generate two
    // binaryOperator filters from this control (one >=, one <=).
    end += this.getStepInterval() / 100;

    const usingDefaultValues = _.isEqual(_.at(value, 'start', 'end'), _.at(column, 'rangeMin', 'rangeMax'))
      && includeNullValues;

    if (usingDefaultValues) {
      const { isHidden } = filter;
      onUpdate(_.merge({}, getDefaultFilterForColumn(column), { isHidden }));
    } else {
      onUpdate(_.merge({}, filter, {
        'function': 'valueRange',
        arguments: {
          start,
          end,
          includeNullValues
        }
      }));
    }
  }

  renderInputFields() {
    const { value } = this.state;
    const step = this.getStepInterval();
    const formatLabel = _.partialRight(roundToPrecision, step);

    return (
      <div className="range-text-inputs-container input-group">
        <input
          id="start"
          className="range-input text-input"
          type="number"
          value={formatLabel(value.start)}
          step={step}
          onChange={this.onInputChange}
          onKeyUp={this.onKeyUp}
          aria-label={I18n.t('shared.components.filter_bar.from')}
          placeholder={I18n.t('shared.components.filter_bar.from')}
          ref={(el) => this.firstInput = el} />
        <span className="range-separator">-</span>
        <input
          id="end"
          className="range-input text-input"
          type="number"
          value={formatLabel(value.end)}
          step={step}
          onChange={this.onInputChange}
          onKeyUp={this.onKeyUp}
          aria-label={I18n.t('shared.components.filter_bar.to')}
          placeholder={I18n.t('shared.components.filter_bar.to')} />
      </div>
    );
  }

  renderSlider() {
    const { column } = this.props;
    const { rangeMin, rangeMax } = column;
    const { value } = this.state;
    const { start, end } = value;
    const step = this.getStepInterval();

    const sliderProps = {
      rangeMin,
      rangeMax,
      value: {
        start: _.clamp(start, rangeMin, end),
        end: _.clamp(end, start, rangeMax)
      },
      step,
      onChange: this.onSliderChange
    };

    return <Slider {...sliderProps} />;
  }

  renderNullValueCheckbox() {
    const { value } = this.state;
    const nullToggleId = _.uniqueId('include-nulls-');
    const inputAttributes = {
      id: nullToggleId,
      className: 'include-nulls-toggle',
      type: 'checkbox',
      onChange: this.onCheckboxChange,
      defaultChecked: value.includeNullValues
    };

    return (
      <form>
        <div className="checkbox">
          <input {...inputAttributes}/>
          <label className="inline-label" htmlFor={nullToggleId}>
            <span className="fake-checkbox">
              <span className="icon-checkmark3"></span>
            </span>
            {I18n.t('shared.components.filter_bar.range_filter.include_null_values')}
          </label>
        </div>
      </form>
    );
  }

  render() {
    const { column, isReadOnly, onClickConfig, onRemove } = this.props;

    const headerProps = {
      name: column.name,
      isReadOnly,
      onClickConfig
    };

    const footerProps = {
      disableApplyFilter: this.shouldDisableApply(),
      isReadOnly,
      onClickApply: this.updateFilter,
      onClickRemove: onRemove,
      onClickReset: this.resetFilter
    };

    return (
      <div className="filter-controls number-filter">
        <div className="range-filter-container">
          <FilterHeader {...headerProps} />
          {this.renderSlider()}
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
  isReadOnly: PropTypes.bool,
  onClickConfig: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}

export default NumberFilter;
