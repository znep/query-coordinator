import PropTypes from 'prop-types';
import React from 'react';
import { STATUS_CALL_IN_PROGRESS, STATUS_CALL_SUCCEEDED, STATUS_CALL_FAILED } from 'lib/apiCallStatus';
import classNames from 'classnames';
import styles from './ApiCallButton.scss';

const ApiCallButton = ({ status, onClick, additionalClassName, children, forceDisable }) => {
  let className;

  switch (status) {
    case STATUS_CALL_IN_PROGRESS:
      className = styles.updatingBtn;
      break;

    case STATUS_CALL_FAILED:
      className = styles.errorBtn;
      break;

    case STATUS_CALL_SUCCEEDED:
      className = styles.successfulBtn;
      break;

    default:
      // null if it's saved
      className = styles.baseBtn;
  }

  const inProgress = status === STATUS_CALL_IN_PROGRESS;

  return (
    <button
      id="save"
      className={classNames(className, additionalClassName)}
      onClick={onClick}
      disabled={forceDisable || inProgress}>
      {inProgress ? <span className={styles.spinner} /> : children || I18n.common.save}
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
