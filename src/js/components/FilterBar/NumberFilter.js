import _ from 'lodash';
import React, { PropTypes } from 'react';
import Slider from '../Slider';
import FilterFooter from './FilterFooter';
import { translate as t } from '../../common/I18n';
import { getPrecision, roundToPrecision } from '../../common/numbers';
import { getDefaultFilterForColumn } from './filters';

export const NumberFilter = React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
    column: PropTypes.shape({
      rangeMin: PropTypes.number.isRequired,
      rangeMax: PropTypes.number.isRequired
    }),
    onCancel: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired
  },

  getInitialState() {
    const { column, filter } = this.props;

    return {
      value: _.defaults(filter.arguments, {
        start: column.rangeMin,
        end: column.rangeMax
      })
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

    return _.min(_.map([rangeMin, rangeMax], getPrecision));
  },

  isValidValue(value) {
    const { rangeMin, rangeMax } = this.props.column;

    return _.isFinite(value) && value >= rangeMin && value <= rangeMax;
  },

  isValidRange(value) {
    const isStartValid = this.isValidValue(value.start);
    const isEndValid = this.isValidValue(value.end);

    return isStartValid && isEndValid && value.start <= value.end;
  },

  updateValueState(newValue) {
    if (this.isValidRange(newValue)) {
      this.setState({
        value: newValue
      });
    }
  },

  shouldDisableApply() {
    const { value } = this.state;

    return _.isEqual(value, this.getInitialState().value);
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
    const { column, filter, onUpdate } = this.props;
    const { value } = this.state;

    if (_.isEqual(_.at(value, 'start', 'end'), _.at(column, 'rangeMin', 'rangeMax'))) {
      onUpdate(getDefaultFilterForColumn(column));
    } else {
      onUpdate(_.merge({}, filter, {
        'function': 'valueRange',
        arguments: {
          start: value.start,
          // We add a small amount to the end of the interval (computed based on precision) to
          // fake a range that is inclusive on both ends.  The real fix is to generate two
          // binaryOperator filters from this control (one >=, one <=).
          end: value.end + this.getStepInterval() / 100
        }
      }));
    }
  },

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
          aria-label={t('filter_bar.from')}
          placeholder={t('filter_bar.from')}
          ref={(el) => this.firstInput = el} />
        <span className="range-separator">-</span>
        <input
          id="end"
          className="range-input text-input"
          type="number"
          value={formatLabel(value.end)}
          step={step}
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
    const step = this.getStepInterval();

    const sliderProps = {
      rangeMin,
      rangeMax,
      value,
      step,
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
