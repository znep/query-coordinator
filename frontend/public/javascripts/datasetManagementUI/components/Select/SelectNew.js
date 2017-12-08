import PropTypes from 'prop-types';
import React from 'react';
import styles from './Select.scss';

const Select = ({ handleChange, field, inErrorState }) => {
  return (
    <select
      name={field.name}
      id={field.name}
      aria-label={field.label}
      aria-required={field.isRequired}
      value={field.value}
      onChange={handleChange}
      className={inErrorState ? styles.selectError : styles.select}>
      {field.options.map((option, idx) => (
        <option value={option.value} key={idx}>
          {option.title}
        </option>
      ))}
    </select>
  );
};

Select.propTypes = {
  field: PropTypes.object.isRequired,
  inErrorState: PropTypes.bool,
  handleChange: PropTypes.func
};

export default Select;
