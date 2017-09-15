import { classNames } from './utils';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

class FormInput extends PureComponent {
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
            htmlFor={id}>
            {showValidationError ? validationError : ''}
          </label>
        </div>
      </div>
    );
  }
}

FormInput.propTypes = {
  children: PropTypes.any.isRequired,
  description: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  required: PropTypes.bool,
  showValidationError: PropTypes.bool,
  validationError: PropTypes.string
};

FormInput.defaultProps = {
  required: false,
  showValidationError: false
};

export default FormInput;
