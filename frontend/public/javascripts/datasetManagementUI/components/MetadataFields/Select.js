import React, { PropTypes } from 'react';
import { FieldDescriptor } from '../../lib/sharedPropTypes';

const Select = ({ descriptor, onChange, value, isValid }) => // eslint-disable-line no-unused-vars
  <select
    id={descriptor.key}
    value={value}
    aria-required={descriptor.required}
    onChange={(evt) => onChange(evt.target.value)}
    className="select">
    {descriptor.options.map((option, idx) =>
      <option value={option.value} key={idx}>{option.title}</option>
    )}
  </select>;

Select.propTypes = {
  descriptor: FieldDescriptor.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  isValid: PropTypes.bool
};

export default Select;
