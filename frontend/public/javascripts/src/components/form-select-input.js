import FormInput from './form-input';
import { classNames } from './utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const FormSelectInputOptionPropType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
});

class FormSelectInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dirty: false,
      value: this.props.initialValue
    };
    _.bindAll(this, 'handleChange');
  }
  componentWillReceiveProps(nextProps) {
    if (this.state.value === '' && this.props.initialValue !== nextProps.initialValue) {
      this.setState({ value: nextProps.initialValue });
    }
  }
  handleChange() {
    const { onChange } = this.props;
    const { value } = this.refs.select;
    this.setState({ dirty: true, value: value });
    onChange(value);
  }
  renderOptions(columns = []) {
    return _.map(columns, ({key, label, value}) => {
      return (
        <option key={key} value={value}>{label}</option>
      );
    });
  }
  render() {
    const {
      id,
      initialOption,
      options,
      required,
      ...props
    } = this.props;

    const {
      dirty,
      value
    } = this.state;

    const className = classNames({ required });
    const showValidationError = required && dirty && _.isEmpty(value);

    const formInputProps = {
      id,
      required,
      showValidationError,
      ...props
    };

    let initialOptionFragment = null;
    if (initialOption) {
      initialOptionFragment = (<option value="">{initialOption}</option>);
    }

    return (
      <FormInput {...formInputProps}>
        <select
          className={className}
          id={id}
          onChange={this.handleChange}
          ref="select"
          value={value}>
          {initialOptionFragment}
          {this.renderOptions(options)}
        </select>
      </FormInput>
    );
  }
}

FormSelectInput.propTypes = {
  description: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  initialOption: PropTypes.string,
  initialValue: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(FormSelectInputOptionPropType),
  required: PropTypes.bool,
  validationError: PropTypes.string
};

FormSelectInput.defaultProps = {
  onBlur: _.noop,
  onChange: _.noop,
  options: [],
  initialValue: '',
  required: false
};

export default FormSelectInput;
