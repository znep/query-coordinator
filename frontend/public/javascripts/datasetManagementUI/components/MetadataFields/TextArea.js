import React, { PropTypes } from 'react';
import { FieldDescriptor } from '../../lib/sharedPropTypes';
import styles from 'styles/MetadataFields/TextArea.scss';

export default function TextArea({ descriptor, onChange, value, isValid }) {
  return (
    <textarea
      rows={descriptor.rows}
      id={descriptor.key}
      className={isValid ? styles.textArea : styles.textAreaError}
      value={value}
      aria-label={descriptor.label}
      aria-required={descriptor.required}
      onChange={(evt) => onChange(evt.target.value)} />
  );
}

TextArea.propTypes = {
  descriptor: FieldDescriptor.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  isValid: PropTypes.bool.isRequired
};
