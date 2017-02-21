import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

export default function Select({ descriptor, onChange, value }) {
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
      <br />
      <select
        id={descriptor.key}
        value={value}
        aria-required={descriptor.required}
        onChange={(evt) => onChange(evt.target.value)}>
        {descriptor.options.map((option) =>
          <option value={option.value} key={option.value}>{option.title}</option>
        )}
      </select>
    </div>
  );
}

Select.propTypes = {
  descriptor: FieldDescriptor.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};
