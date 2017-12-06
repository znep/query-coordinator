import PropTypes from 'prop-types';
import React from 'react';
import styles from './TextArea.scss';

const TextArea = ({ handleChange, field }) => {
  return (
    <textarea
      id={field.name}
      name={field.name}
      placeholder={field.placeholder}
      className={styles.textArea}
      aria-label={field.label}
      aria-required={field.isRequired}
      value={field.value}
      onChange={handleChange} />
  );
};

TextArea.propTypes = {
  field: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired
};

export default TextArea;
