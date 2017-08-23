import React, { PropTypes } from 'react';
import styles from './TextInput.scss';

const TextInput = ({ inErrorState, handleFocus, handleBlur, handleChange, ...data }) => {
  const classNames = inErrorState ? styles.textInputError : styles.textInput;
  const { isRequired, label, name, value, placeholder } = data;

  return (
    <input
      type="text"
      id={name}
      name={name}
      value={value || ''}
      placeholder={placeholder}
      aria-label={label}
      aria-required={isRequired}
      className={classNames}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange} />
  );
};

TextInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  isRequired: PropTypes.bool.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  handleFocus: PropTypes.func.isRequired
};

export default TextInput;
