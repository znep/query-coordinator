import PropTypes from 'prop-types';
import React from 'react';
import styles from './TextArea.module.scss';

const TextArea = ({ handleChange, field, inErrorState }) => {
  return (
    <textarea
      id={field.name}
      name={field.name}
      placeholder={field.placeholder}
      className={inErrorState ? styles.textAreaError : styles.textArea}
      aria-label={field.label}
      aria-required={field.isRequired}
      value={field.value}
      onChange={handleChange} />
  );
};

TextArea.propTypes = {
  field: PropTypes.object.isRequired,
  inErrorState: PropTypes.bool,
  handleChange: PropTypes.func.isRequired
};

export default TextArea;
