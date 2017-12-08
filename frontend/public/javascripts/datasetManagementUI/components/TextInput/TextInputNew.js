import PropTypes from 'prop-types';
import React from 'react';
import styles from './TextInput.scss';

const TextInput = ({ handleChange, field, inErrorState }) => {
  return (
    <input
      type="text"
      id={field.name}
      name={field.name}
      value={field.value}
      placeholder={field.placeholder}
      aria-label={field.label}
      aria-required={field.isRequired}
      className={inErrorState ? styles.textInputError : styles.textInput}
      onChange={handleChange} />
  );
};

TextInput.propTypes = {
  field: PropTypes.object.isRequired,
  inErrorState: PropTypes.bool,
  handleChange: PropTypes.func.isRequired
};

export default TextInput;
