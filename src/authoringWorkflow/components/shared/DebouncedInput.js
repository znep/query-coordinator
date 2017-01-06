import _ from 'lodash';
import React from 'react';
import {
  INPUT_DEBOUNCE_MILLISECONDS
} from '../../constants';

export default class DebouncedInput extends React.Component {
  constructor(props) {
    super(props);

    // Radiobuttons and checkboxes uses checked instead of value
    this.usingChecked = props.type === 'checkbox' || props.type === 'radio';

    if (this.usingChecked && _.isUndefined(props.checked)) {
      throw new Error(`DebouncedInput with type="${props.type}" needs "checked" property to be set.`);
    }

    if (!this.usingChecked && _.isUndefined(props.value)) {
      throw new Error(`DebouncedInput with type="${props.type}" needs "value" property to be set.`);
    }

    this.state = {
      value: props.value || '',
      checked: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.timeoutId = null;
  }

  componentWillReceiveProps(nextProps) {
    if (this.usingChecked && nextProps.checked != this.state.checked) {
      this.setState({ value: nextProps.checked });
    } else if (nextProps.value != this.state.value) {
      this.setState({ value: nextProps.value });
    }
  }

  handleChange(event) {
    event.persist();

    if (this.usingChecked) {
      this.setState({ checked: event.target.checked });
    } else {
      this.setState({ value: event.target.value });
    }

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.props.onChange(event);
    }, INPUT_DEBOUNCE_MILLISECONDS)
  }

  render() {
    if (this.usingChecked) {
      return <input {...this.props} checked={this.state.checked} onChange={this.handleChange}/>;
    } else {
      return <input {...this.props} value={this.state.value} onChange={this.handleChange}/>;
    }
  }
}

DebouncedInput.defaultProps = {
  type: 'text'
};

DebouncedInput.propTypes = {
  value: React.PropTypes.any,
  checked: React.PropTypes.bool,
  onChange: React.PropTypes.func.isRequired,
  type: React.PropTypes.string
};
