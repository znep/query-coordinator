import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

export default function TextArea({ descriptor, onChange, value, isValid }) {
  const classes = classNames('text-input', 'text-area', { 'text-input-error': !isValid });

  return (
    <textarea
      rows={descriptor.rows}
      id={descriptor.key}
      className={classes}
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
