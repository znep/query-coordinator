import React, { PropTypes } from 'react';
import { FieldDescriptor } from '../../lib/sharedPropTypes';
import styles from 'styles/MetadataFields/TextInput.scss';

const TextInput = ({ descriptor, onChange, value, isValid }) => {
  return (
    <input
      type="text"
      id={descriptor.key}
      aria-label={descriptor.label}
      aria-required={descriptor.required}
      className={isValid ? styles.textInput : styles.textInputError}
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
