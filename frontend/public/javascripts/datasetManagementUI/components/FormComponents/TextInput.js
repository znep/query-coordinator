import React, { PropTypes } from 'react';
import styles from 'styles/MetadataFields/TextInput.scss';

const TextInput = ({ field, inErrorState, setValue }) => {
  const classNames = inErrorState ? styles.textInputError : styles.textInput;

  return (
    <input
      type="text"
      id={field.name}
      aria-label={field.label}
      aria-required={field.isRequired}
      className={classNames}
      placeholder={field.placeholder}
      value={field.value || ''}
      onChange={e => setValue(e.target.value)} />
  );
};

TextInput.propTypes = {
  field: PropTypes.object.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  setValue: PropTypes.func.isRequired
};

export default TextInput;
