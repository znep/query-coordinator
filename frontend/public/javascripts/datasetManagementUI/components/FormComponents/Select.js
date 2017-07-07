import React, { PropTypes } from 'react';
import styles from 'styles/FormComponents/Select.scss';

const Select = ({ field, inErrorState, setValue, handleBlur, handleFocus }) =>
  <select
    id={field.name}
    aria-label={field.label}
    aria-required={field.isRequired}
    value={field.value || ''}
    className={inErrorState ? styles.selectError : styles.select}
    onBlur={handleBlur}
    onFocus={handleFocus}
    onChange={e => setValue(e.target.value)}>
    {field.options.map((option, idx) =>
      <option value={option.value} key={idx}>
        {option.title}
      </option>
    )}
  </select>;

Select.propTypes = {
  field: PropTypes.object.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  setValue: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  handleFocus: PropTypes.func.isRequired
};

export default Select;
