import React from 'react';
import PropTypes from 'prop-types';

// TODO : reconcile with APICallButton at some point
const SubmitButton = ({ isDisabled, handleClick, buttonName }) => (
  <label
    htmlFor={buttonName}
    className={`btn btn-primary ${isDisabled ? 'dsmp-disabled' : ''}`}
    onClick={isDisabled ? e => e.preventDefault() : handleClick}
    disabled={isDisabled}>
    {I18n.common.save}
  </label>
);

SubmitButton.propTypes = {
  handleClick: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  buttonName: PropTypes.string.isRequired
};

export default SubmitButton;
