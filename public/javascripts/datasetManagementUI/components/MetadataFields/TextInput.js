import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

export default function TextInput({ descriptor, onChange, value }) {
  const isValid = descriptor.validator(value);
  const classes = classNames('text-input', { 'text-input-error': !isValid });
  const errorMsg = isValid ?
    null :
    <span className="metadata-validation-error">{descriptor.errorMsg}</span>;

  return (
    <div>
      <label
        htmlFor={descriptor.key}
        className="block-label">
        {descriptor.label}
      </label>
      <input
        type="text"
        id={descriptor.key}
        aria-label={descriptor.label}
        className={classes}
        value={value}
        onChange={(evt) => onChange(evt.target.value)} />
      {errorMsg}
    </div>
  );
}

TextInput.propTypes = {
  descriptor: FieldDescriptor.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};
