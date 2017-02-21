import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

export default function TextInput({ descriptor, onChange, value }) {
  const isValid = descriptor.validator ? descriptor.validator(value) : true;
  const classes = classNames('text-input', { 'text-input-error': !isValid });
  const errorMsg = isValid ?
    null :
    <span className="metadata-validation-error">{descriptor.errorMsg}</span>;

  const labelClasses = descriptor.required ?
                       classNames('block-label', 'required') :
                       classNames('block-label');

  return (
    <div className={descriptor.divClassName}>
      <label htmlFor={descriptor.key} className={labelClasses}>
        {descriptor.label}
      </label>
      <input
        type="text"
        id={descriptor.key}
        aria-label={descriptor.label}
        aria-required={descriptor.required}
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
