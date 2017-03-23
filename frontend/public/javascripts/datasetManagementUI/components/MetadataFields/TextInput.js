import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

const TextInput = ({ descriptor, onChange, value, isValid }) => {
  const classes = classNames('text-input', { 'text-input-error': !isValid });

  return (
    <input
      type="text"
      id={descriptor.key}
      aria-label={descriptor.label}
      aria-required={descriptor.required}
      className={classes}
      value={value}
      placeholder={descriptor.placeholder}
      onChange={(evt) => onChange(evt.target.value)} />
  );
};

TextInput.propTypes = {
  descriptor: FieldDescriptor.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  isValid: PropTypes.bool.isRequired
};

export default TextInput;
