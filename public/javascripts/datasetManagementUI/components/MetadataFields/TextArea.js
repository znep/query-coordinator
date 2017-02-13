import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

export default function TextArea({ descriptor, onChange, value }) {
  const isValid = descriptor.validator(value);
  const classes = classNames('text-input', 'text-area', { 'text-input-error': !isValid });
  const errorMsg = isValid ?
    null :
    <span className="metadata-validation-error">{descriptor.errorMsg}</span>;

  return (
    <div>
      <label
        htmlFor={descriptor.key}
        className="inline-label">
        {descriptor.label}
      </label>
      <br />
      <textarea
        id={descriptor.key}
        className={classes}
        value={value}
        aria-label={descriptor.label}
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
