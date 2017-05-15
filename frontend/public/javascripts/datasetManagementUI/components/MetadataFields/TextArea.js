import React, { PropTypes } from 'react';
import styles from 'styles/MetadataFields/TextArea.scss';

export default function TextArea({ name, bindInput, label, rows, required, inErrorState, showErrors }) {
  const classNames = inErrorState ? styles.textAreaError : styles.textArea;

  return (
    <textarea
      rows={rows}
      id={name}
      className={classNames}
      aria-label={label}
      onBlur={showErrors}
      aria-required={required}
      {...bindInput(name)} />
  );
}

TextArea.propTypes = {
  name: PropTypes.string.isRequired,
  bindInput: PropTypes.func.isRequired,
  label: PropTypes.string,
  rows: PropTypes.number,
  required: PropTypes.bool,
  inErrorState: PropTypes.bool,
  showErrors: PropTypes.func
};
