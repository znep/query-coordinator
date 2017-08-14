import React, { PropTypes } from 'react';
import styles from 'styles/FormComponents/TextArea.scss';

export default function TextArea({ inErrorState, handleFocus, handleBlur, handleChange, ...data }) {
  const classNames = inErrorState ? styles.textAreaError : styles.textArea;
  const { isRequired, label, name, value, placeholder } = data;

  return (
    <textarea
      id={name}
      name={name}
      placeholder={placeholder}
      className={classNames}
      aria-label={label}
      aria-required={isRequired}
      value={value || ''}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange} />
  );
}

TextArea.propTypes = {
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
