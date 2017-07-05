import React, { PropTypes } from 'react';
import styles from 'styles/FormComponents/TextArea.scss';

export default function TextArea({ field, inErrorState, setValue }) {
  const classNames = inErrorState ? styles.textAreaError : styles.textArea;

  return (
    <textarea
      id={field.name}
      className={classNames}
      aria-label={field.label}
      aria-required={field.isRequired}
      placeholder={field.placeholder}
      value={field.value || ''}
      onChange={e => setValue(e.target.value)} />
  );
}

TextArea.propTypes = {
  field: PropTypes.object.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  setValue: PropTypes.func.isRequired
};
