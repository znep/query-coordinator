import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  STATUS_CALL_IN_PROGRESS,
  STATUS_CALL_SUCCEEDED,
  STATUS_CALL_FAILED
} from 'lib/apiCallStatus';
import classNames from 'classnames';
import styles from 'styles/ApiCallButton.scss';

const ApiCallButton = ({ status, onClick, additionalClassName, children }) => {
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

    default: // null if it's saved
      className = styles.baseBtn;
  }
  const inProgress = status === STATUS_CALL_IN_PROGRESS;
  return (
    <button
      id="save"
      className={classNames(className, additionalClassName)}
      onClick={onClick}
      disabled={inProgress}>
      {
        inProgress
          ? <span className={styles.spinner}></span>
          : (children || I18n.common.save)
      }
    </button>
  );
};

ApiCallButton.propTypes = {
  status: PropTypes.string, // null means it's saved
  onClick: PropTypes.func.isRequired,
  additionalClassName: PropTypes.string,
  children: PropTypes.node
};

const SHOW_RESULT_STATE_FOR_MS = 1000;

function mapStateToProps(state, ownProps) {
  const apiCall = _.find(state.ui.apiCalls, (call) => (
    _.matches(call, {
      operation: ownProps.operation,
      params: ownProps.params
    }) && (
      new Date() - (call.succeededAt || call.failedAt || call.startedAt) < SHOW_RESULT_STATE_FOR_MS
    )
  ));
  return {
    status: apiCall ? apiCall.status : null
  };
}

const ConnectedApiCallButton = connect(mapStateToProps)(ApiCallButton);

ConnectedApiCallButton.propTypes = {
  operation: PropTypes.string.isRequired,
  params: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  additionalClassName: PropTypes.string,
  children: PropTypes.node
};

export default ConnectedApiCallButton;
