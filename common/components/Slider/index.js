import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import InputRange from 'react-input-range';

export class Slider extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onChange',
      'formatLabel'
    ]);
  }

  componentWillMount() {
    this.labelId = `slider-label-${_.uniqueId()}`;
  }

  onChange(inputRangeComponent, value) {
    const newValue = _.isPlainObject(value) ?
      { start: value.min, end: value.max } :
      value;

    this.props.onChange(newValue);
  }

  formatLabel(label) {
    return <span id={this.labelId}>{_.round(label, 1)}</span>;
  }

  render() {
    let displayableValue;
    const { rangeMin, rangeMax, step, value } = this.props;

    if (_.isPlainObject(value)) {
      displayableValue = {
        min: _.get(value, 'start', rangeMin),
        max: _.get(value, 'end', rangeMax)
      };
    } else if (_.isNumber(value)) {
      displayableValue = _.clamp(value, rangeMin, rangeMax);
    } else {
      displayableValue = rangeMax;
    }

    const inputRangeProps = {
      minValue: rangeMin,
      maxValue: rangeMax,
      step,
      value: displayableValue,
      onChange: this.onChange,
      ariaLabelledby: this.labelId,
      formatLabel: this.formatLabel
    };

    return (
      <div className="input-range-slider">
        <InputRange {...inputRangeProps} />
      </div>
    );
  }
}

Slider.propTypes = {
  /**
   * The minimum value selectable.
   */
  rangeMin: PropTypes.number.isRequired,

  /**
   * The maximum value selectable.
   */
  rangeMax: PropTypes.number.isRequired,

  /**
   * The increment that the user can move the handle(s).
   */
  step: PropTypes.number,

  /**
   * The value the slider should show. It comes in two flavors:
   * - The object flavor lets you select two values with the
   *   same slider. Renders two handles. (See the shape.)
   * - The number flavor is a single selection and only renders
   *   one handle.
   */
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      start: PropTypes.number,
      end: PropTypes.number
    })
  ]),

  /**
   * The change event is fired when the slider is dragged
   * or keyboard-navigated. The callback's value depends
   * on how props.value was set. If it was an object, you'll
   * get an object. If it was a number, you'll get a number.
   */
  onChange: PropTypes.func.isRequired
};

Slider.defaultProps = {
  step: 5
};

export default Slider;
