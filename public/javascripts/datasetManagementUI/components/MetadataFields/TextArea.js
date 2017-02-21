import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

export default function TextArea({ descriptor, onChange, value }) {
  const isValid = descriptor.validator(value);
  const classes = classNames('text-input', 'text-area', { 'text-input-error': !isValid });
  const errorMsg = isValid ?
    null :
    <span className="metadata-validation-error">{descriptor.errorMsg}</span>;

  const labelClasses = descriptor.required ?
    classNames('inline-label', 'required') :
    classNames('inline-label');
  return (
    <div className={descriptor.divClassName}>
      <label
        htmlFor={descriptor.key}
        className={labelClasses}>
        {descriptor.label}
      </label>
      <textarea
        rows={descriptor.rows}
        id={descriptor.key}
        className={classes}
        value={value}
        aria-label={descriptor.label}
        aria-required={descriptor.required}
        onChange={(evt) => onChange(evt.target.value)} />
      {errorMsg}
    </div>
  );
}

TextArea.propTypes = {
  descriptor: FieldDescriptor.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};
