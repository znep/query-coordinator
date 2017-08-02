import React, { PropTypes } from 'react';
import styles from 'styles/FormComponents/TextInput.scss';

const TextInput = ({ inErrorState, name, label, isRequired, ...rest }) => {
  const classNames = inErrorState ? styles.textInputError : styles.textInput;

  return (
    <input
      {...rest}
      type="text"
      id={name}
      aria-label={label}
      aria-required={isRequired}
      className={classNames} />
  );
};

TextInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  isPrivate: PropTypes.bool.isRequired,
  isRequired: PropTypes.bool.isRequired,
  isCustom: PropTypes.bool.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired
};

export default TextInput;
