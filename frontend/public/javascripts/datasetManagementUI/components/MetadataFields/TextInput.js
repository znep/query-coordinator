import React, { PropTypes } from 'react';
import styles from 'styles/MetadataFields/TextInput.scss';

const TextInput = ({ bindInput, name, label, placeholder, required, inErrorState, showErrors }) => {
  const classNames = inErrorState ? styles.textInputError : styles.textInput;

  return (
    <input
      type="text"
      id={name}
      aria-label={label}
      aria-required={required}
      className={classNames}
      onBlur={showErrors}
      placeholder={placeholder}
      {...bindInput(name)} />
  );
};

TextInput.propTypes = {
  bindInput: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  inErrorState: PropTypes.bool,
  showErrors: PropTypes.func
};

export default TextInput;
