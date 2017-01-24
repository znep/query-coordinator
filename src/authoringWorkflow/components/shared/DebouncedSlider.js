import _ from 'lodash';
import React from 'react';
import Styleguide from 'socrata-components';
import {
  INPUT_DEBOUNCE_MILLISECONDS
} from '../../constants';

export default class DebouncedSlider extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value
    };

    this.timeoutId = null;
    this.handleSliderChange = this.handleSliderChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({ value: nextProps.value });
    }
  }

  handleSliderChange(value) {
    this.setState(
      { value },
      () => {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(() => this.props.onChange(this.state.value), this.props.delay);
      }
    );
  }

  render() {
    const props = _.omit(this.props, ['value', 'onChange']);
    return <Styleguide.Slider {...props} value={this.state.value} onChange={this.handleSliderChange}/>;
  }
}

DebouncedSlider.defaultProps = {
  delay: INPUT_DEBOUNCE_MILLISECONDS
};

DebouncedSlider.propTypes = {
  delay: React.PropTypes.number,
  onChange: React.PropTypes.func.isRequired
};
