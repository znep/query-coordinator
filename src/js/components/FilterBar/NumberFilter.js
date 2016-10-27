import _ from 'lodash';
import React, { PropTypes } from 'react';
import Slider from '../Slider';
import FilterFooter from './FilterFooter';
import { translate as t } from '../../common/I18n';

export const NumberFilter = React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired
  },

  getInitialState() {
    const { filter } = this.props;

    return {
      value: _.get(filter, 'parameters.arguments', {})
    };
  },

  componentDidMount() {
    if (this.firstInput) {
      this.firstInput.focus();
    }
  },

  onInputChange({ target }) {
    const { value } = this.state;

    const newValue = _.merge({}, value, {
      [target.id]: _.toNumber(target.value)
    });

    this.updateValueState(newValue);
  },

  onSliderChange(newValue) {
    this.updateValueState(newValue);
  },

  getStepInterval() {
    const { rangeMin, rangeMax } = this.props.column;

    return (rangeMax - rangeMin) / 20;
  },

  isValidValue(value) {
    const { rangeMin, rangeMax } = this.props.column;

    return _.isFinite(value) && value >= rangeMin && value <= rangeMax;
  },

  isValidRange(value) {
    const isValidRange = value.start <= value.end;
    const isStartValid = this.isValidValue(value.start);
    const isEndValid = this.isValidValue(value.end);

    return isValidRange && isStartValid && isEndValid;
  },

  updateValueState(newValue) {
    if (this.isValidRange(newValue)) {
      this.setState({
        value: newValue
      });
    }
  },

  shouldDisableApply() {
    const { filter } = this.props;
    const { value } = this.state;

    const initialValue = filter.parameters.arguments;

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
    const { filter, onUpdate } = this.props;
    const { value } = this.state;

    const newFilter = _.merge({}, filter, {
      parameters: {
        arguments: value
      }
    });

    onUpdate(newFilter);
  },

  renderInputFields() {
    const { value } = this.state;

    return (
      <div className="range-text-inputs-container input-group">
        <input
          id="start"
          className="range-input text-input"
          type="number"
          value={value.start}
          onChange={this.onInputChange}
          aria-label={t('filter_bar.from')}
          placeholder={t('filter_bar.from')}
          ref={(el) => this.firstInput = el} />
        <span className="range-separator">-</span>
        <input
          id="end"
          className="range-input text-input"
          type="number"
          value={value.end}
          onChange={this.onInputChange}
          aria-label={t('filter_bar.to')}
          placeholder={t('filter_bar.to')} />
      </div>
    );
  },

  renderSlider() {
    const { column } = this.props;
    const { rangeMin, rangeMax } = column;
    const { value } = this.state;

    const sliderProps = {
      rangeMin,
      rangeMax,
      value,
      step: this.getStepInterval(),
      onChange: this.onSliderChange
    };

    return <Slider {...sliderProps} />;
  },

  render() {
    const { onCancel } = this.props;

    const filterFooterProps = {
      disableApplyFilter: this.shouldDisableApply(),
      onClickApply: this.updateFilter,
      onClickCancel: onCancel,
      onClickClear: this.clearFilter
    };

    return (
      <div className="filter-controls number-filter">
        <div className="range-filter-container">
          <div className="filter-control-title">{t('filter_bar.range')}</div>
          {this.renderSlider()}
          {this.renderInputFields()}
        </div>
        <FilterFooter {...filterFooterProps} />
      </div>
    );
  }
});

export default NumberFilter;
