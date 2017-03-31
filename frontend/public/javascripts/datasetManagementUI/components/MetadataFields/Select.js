import React, { PropTypes } from 'react';
import styles from 'styles/MetadataFields/Select.scss';

const Select = ({ name, options, label, bindInput, required, showErrors }) =>
  <select
    id={name}
    aria-label={label}
    aria-required={required}
    className={styles.select}
    onBlur={showErrors}
    {...bindInput(name)}>
    {options.map((option, idx) =>
      <option value={option.value} key={idx}>{option.title}</option>
    )}
  </select>;

Select.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string,
    value: PropTypes.string
  })).isRequired,
  label: PropTypes.string,
  bindInput: PropTypes.func.isRequired,
  required: PropTypes.bool,
  showErrors: PropTypes.func
};

export default Select;
