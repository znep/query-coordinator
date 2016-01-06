import { classNames } from './utils';
import React, { PropTypes } from 'react';

const FormInput = React.createClass({
  propTypes: {
    children: PropTypes.any.isRequired,
    description: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    required: PropTypes.bool,
    showValidationError: PropTypes.bool,
    validationError: PropTypes.string
  },
  getDefaultProps() {
    return {
      required: false,
      showValidationError: false
    };
  },
  render() {
    const {
      children,
      description,
      id,
      label,
      required,
      showValidationError,
      validationError
    } = this.props;

    const className = classNames({ required });

    return (
      <div className="line">
        <label htmlFor={id} className={className}>{label}</label>
        <div>
          {children}
          <p>{description}</p>
          <label
            className="error"
            htmlFor={id}
            generated="true"
            >
            {showValidationError ? validationError : ''}
          </label>
        </div>
      </div>
    );
  }
});

export default FormInput;
