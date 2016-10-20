import _ from 'lodash';
import React, { PropTypes } from 'react';
import InputRange from 'react-input-range';

export const Slider = React.createClass({
  propTypes: {
    rangeMin: PropTypes.number.isRequired,
    rangeMax: PropTypes.number.isRequired,
    step: PropTypes.number,
    value: PropTypes.shape({
      start: PropTypes.number,
      end: PropTypes.number
    }),
    onChange: PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      step: 5
    };
  },

  onChange(inputRangeComponent, value) {
    this.props.onChange({
      start: value.min,
      end: value.max
    });
  },

  formatAccessibleLabel(label) {
    return <span className="hidden">{label}</span>;
  },

  render() {
    const { rangeMin, rangeMax, step, value } = this.props;

    const displayableValue = {
      min: _.get(value, 'start', rangeMin),
      max: _.get(value, 'end', rangeMax)
    };

    const inputRangeProps = {
      minValue: rangeMin,
      maxValue: rangeMax,
      step,
      value: displayableValue,
      onChange: this.onChange,
      formatLabel: this.formatAccessibleLabel
    };

    return (
      <div className="input-range-slider">
        <InputRange {...inputRangeProps} />
      </div>
    );
  }
});

export default Slider;
