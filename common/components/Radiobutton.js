import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

// A simple controlled radio button. The containing app is in full
// control of whether or not the radio button is selected.
const Radiobutton = ({ checked, disabled, id, onChange, children }) => {
  let inputRef;

  const inputAttributes = {
    checked,
    disabled,
    id,
    ref: (ref) => inputRef = ref,
    onChange
  };

  return (
    <div className="radiobutton">
      <input type="radio" {...inputAttributes} />
      <label className="inline-label" htmlFor={id}>
        <span className="fake-radiobutton" />
        {children}
      </label>
    </div>
  );
};

Radiobutton.propTypes = {
  checked: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

Radiobutton.defaultProps = {
  disabled: false,
  onChange: _.noop
};

export default Radiobutton;
