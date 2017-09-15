import FormInput from './form-input';
import { classNames } from './utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

class FormTextInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dirty: false,
      value: this.props.initialValue
    };
    _.bindAll(this, 'handleChange', 'handleBlur');
  }
  componentWillReceiveProps(nextProps) {
    if (this.state.value === '' && this.props.initialValue !== nextProps.initialValue) {
      this.setState({ value: nextProps.initialValue });
    }
  }
  handleChange() {
    const { onChange } = this.props;
    const input = this.refs.input;
    const value = input.value;
    this.setState({ dirty: true, value: value });
    onChange(value);
  }
  handleBlur() {
    this.setState({ dirty: true });
  }
  render() {
    const {
      id,
      required,
      requiredFieldValidationError,
      contentValidator,
      ...props
    } = this.props;

    const {
      dirty,
      value
    } = this.state;

    const className = classNames({ required });

    const contentValidation = contentValidator();
    const hasContentValidationError = !contentValidation.valid;
    const hasRequiredFieldError = required && dirty && _.isEmpty(value);

    const showValidationError = hasRequiredFieldError || hasContentValidationError;
    const validationError = hasRequiredFieldError ? requiredFieldValidationError : contentValidation.message;

    const formInputProps = {
      id,
      required,
      showValidationError,
      validationError,
      ...props
    };

    return (
      <FormInput {...formInputProps}>
        <input
          className={className}
          id={id}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          ref="input"
          type="text"
          value={value} />
      </FormInput>
    );
  }
}

FormTextInput.propTypes = {
  description: PropTypes.string,
  id: PropTypes.string.isRequired,
  initialValue: PropTypes.string,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  requiredFieldValidationError: PropTypes.string,
  contentValidator: PropTypes.func
};

FormTextInput.defaultProps = {
  description: '',
  requiredFieldValidationError: '',
  initialValue: '',
  onBlur: _.noop,
  onChange: _.noop,
  required: false,
  contentValidator: _.constant({valid: true})
};

export default FormTextInput;
