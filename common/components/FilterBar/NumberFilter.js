import _ from 'lodash';
import React, { PropTypes } from 'react';
import Slider from '../Slider';
import FilterHeader from './FilterHeader';
import FilterFooter from './FilterFooter';
import { translate as t } from 'common/I18n';
import { ENTER, isolateEventByKeys } from 'common/keycodes';
import { getPrecision, roundToPrecision } from 'common/numbers';
import { getDefaultFilterForColumn } from './filters';

export const NumberFilter = React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
    column: PropTypes.shape({
      rangeMin: PropTypes.number.isRequired,
      rangeMax: PropTypes.number.isRequired
    }),
    isReadOnly: PropTypes.bool,
    onClickConfig: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
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
    this.updateValueState({
      [target.id]: _.toNumber(target.value)
    });
  },

  onKeyUp(event) {
    isolateEventByKeys(event, [ENTER]);

    if (event.keyCode === ENTER && !this.shouldDisableApply()) {
      this.updateFilter();
    }
  },

  onSliderChange(newValue) {
    this.updateValueState(newValue);
  },

  getStepInterval() {
    const { rangeMin, rangeMax } = this.props.column;

    return _.min(_.map([rangeMin, rangeMax], getPrecision));
  },

  updateValueState(updates) {
    this.setState({
      value: {
        ...this.state.value,
        ...updates
      }
    });
  },

  shouldDisableApply() {
    const { value } = this.state;

    return _.isEqual(value, this.getInitialState().value);
  },

  resetFilter() {
    const { rangeMin, rangeMax } = this.props.column;

    this.updateValueState({
      start: rangeMin,
      end: rangeMax
    });
  },

  updateFilter() {
    const { column, filter, onUpdate } = this.props;
    const { value } = this.state;

    // Swap the start and end if necessary to ensure the range is valid
    let { start, end } = value;
    if (start > end) {
      [start, end] = [end, start];
    }

    // Add a small amount to the end of the interval (computed based on precision) to
    // fake a range that is inclusive on both ends.  The real fix is to generate two
    // binaryOperator filters from this control (one >=, one <=).
    end += this.getStepInterval() / 100;

    if (_.isEqual(_.at(value, 'start', 'end'), _.at(column, 'rangeMin', 'rangeMax'))) {
      const { isHidden } = filter;
      onUpdate(_.merge({}, getDefaultFilterForColumn(column), { isHidden }));
    } else {
      onUpdate(_.merge({}, filter, {
        function: 'valueRange',
        arguments: {
          start,
          end
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
          onKeyUp={this.onKeyUp}
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
          onKeyUp={this.onKeyUp}
          aria-label={t('filter_bar.to')}
          placeholder={t('filter_bar.to')} />
      </div>
    );
  },

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
  },

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
        </div>
        <FilterFooter {...footerProps} />
      </div>
    );
  }
});

export default NumberFilter;