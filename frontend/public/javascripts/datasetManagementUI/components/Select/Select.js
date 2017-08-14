import React, { PropTypes } from 'react';
import styles from 'styles/FormComponents/Select.scss';

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
      {options.map((option, idx) =>
        <option value={option.value} key={idx}>
          {option.title}
        </option>
      )}
    </select>
  );
};

Select.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string,
  isRequired: PropTypes.bool.isRequired,
  options: PropTypes.array.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  handleFocus: PropTypes.func.isRequired
};

export default Select;
