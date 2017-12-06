import PropTypes from 'prop-types';
import React from 'react';
import styles from './TextInput.scss';

const TextInput = ({ handleChange, field }) => {
  return (
    <input
      type="text"
      id={field.name}
      name={field.name}
      value={field.value}
      placeholder={field.placeholder}
      aria-label={field.label}
      aria-required={field.isRequired}
      className={styles.textInput}
      onChange={handleChange} />
  );
};

TextInput.propTypes = {
  field: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired
};

export default TextInput;
