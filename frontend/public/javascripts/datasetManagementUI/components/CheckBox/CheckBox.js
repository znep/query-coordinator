import PropTypes from 'prop-types';
import React from 'react';
import styles from './CheckBox.scss';

const CheckBox = ({ handleClick, ...data }) => {
  const classNames = styles.checkbox;
  const { label, name, value } = data;

  return (
    <input
      type="checkbox"
      id={name}
      name={name}
      value="true"
      checked={value}
      aria-label={label}
      className={classNames}
      onChange={handleClick} />
  );
};

CheckBox.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.bool,
  label: PropTypes.string,
  handleClick: PropTypes.func
};

export default CheckBox;
