import PropTypes from 'prop-types';
import React from 'react';
import styles from './Select.scss';

const Select = ({ inErrorState, handleFocus, handleBlur, handleChange, options, ...data }) => {
  const { name, value, label, isRequired } = data;

  return (
    <select
      name={name}
      id={name}
      aria-label={label}
      aria-required={isRequired}
      value={value || ''}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={inErrorState ? styles.selectError : styles.select}>
      {options.map((option, idx) => (
        <option value={option.value} key={idx}>
          {option.title}
        </option>
      ))}
    </select>
  );
};

Select.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string,
  isRequired: PropTypes.bool,
  options: PropTypes.array.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  handleChange: PropTypes.func,
  handleBlur: PropTypes.func,
  handleFocus: PropTypes.func
};

export default Select;
