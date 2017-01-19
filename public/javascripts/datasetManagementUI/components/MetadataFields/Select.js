import React, { PropTypes } from 'react';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

export default function Select({ descriptor, onChange, value }) {
  return (
    <div>
      <label
        htmlFor={descriptor.key}
        className="inline-label">
        {descriptor.label}
      </label>
      <br />
      <select
        id={descriptor.key}
        value={value}
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
