import React, { PropTypes } from 'react';
import styles from 'styles/MetadataFields/Select.scss';

const Select = ({ field, inErrorState, setValue }) =>
  <select
    id={field.name}
    aria-label={field.label}
    aria-required={field.isRequired}
    className={inErrorState ? styles.selectError : styles.select}
    onChange={e => setValue(field.name, e.target.value)}>
    {field.options.map((option, idx) =>
      <option value={option.value} key={idx}>
        {option.title}
      </option>
    )}
  </select>;

Select.propTypes = {
  field: PropTypes.object.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  setValue: PropTypes.func.isRequired
};

export default Select;
