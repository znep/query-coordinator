import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

// A simple controlled checkbox. The containing app is in full
// control of whether or not the checkbox is checked.
const Checkbox = ({ checked, disabled, id, onChange, children }) => {
  let inputRef;

  const inputAttributes = {
    checked,
    disabled,
    id,
    ref: (ref) => inputRef = ref,
    onChange
  };

  return (
    <div className="checkbox">
      <input type="checkbox" {...inputAttributes} />
      <label className="inline-label" htmlFor={id}>
        <span className="fake-checkbox"><span className="icon-checkmark3"></span></span>
        {children}
      </label>
    </div>
  );
};

Checkbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

Checkbox.defaultProps = {
  onChange: _.noop
};

export default Checkbox;
