import PropTypes from 'prop-types';
import React from 'react';
import {
  STATUS_CALL_IN_PROGRESS,
  STATUS_CALL_SUCCEEDED,
  STATUS_CALL_FAILED
} from 'datasetManagementUI/lib/apiCallStatus';
import classNames from 'classnames';

const ApiCallButton = ({ status, onClick, additionalClassName, children, forceDisable }) => {
  let className;

  switch (status) {
    case STATUS_CALL_IN_PROGRESS:
      className = 'btn btn-primary btn-busy btn-sm';
      break;

    case STATUS_CALL_FAILED:
      className = 'btn btn-primary btn-error';
      break;

    case STATUS_CALL_SUCCEEDED:
      className = 'btn btn-primary btn-success';
      break;

    default:
      // null if it's saved
      className = 'btn btn-primary';
  }

  const inProgress = status === STATUS_CALL_IN_PROGRESS;

  return (
    <button
      id="save"
      className={classNames(className, additionalClassName)}
      onClick={onClick}
      disabled={forceDisable || inProgress}>
      {inProgress ? <span className="spinner-default spinner-btn-primary" /> : children || I18n.common.save}
    </button>
  );
};

ApiCallButton.propTypes = {
  status: PropTypes.string, // null means it's saved
  onClick: PropTypes.func.isRequired,
  additionalClassName: PropTypes.string,
  children: PropTypes.node,
  forceDisable: PropTypes.bool
};

export default ApiCallButton;
