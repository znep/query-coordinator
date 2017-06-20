import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import SocrataIcon from '../../common/components/SocrataIcon';
import * as ApplyRevision from 'actions/applyRevision';
import { STATUS_CALL_IN_PROGRESS, STATUS_CALL_SUCCEEDED } from 'lib/apiCallStatus';
import styles from 'styles/NotifyButton.scss';

function NotifyButton({ apiCall, taskSet, addEmailInterest, className }) {
  if (taskSet) {
    if (apiCall) {
      if (apiCall.status === STATUS_CALL_IN_PROGRESS) {
        return (
          <button className={classNames(className, styles.emailBtnBusy)}>
            <span className={styles.spinner} />
          </button>
        );
      } else if (apiCall.status === STATUS_CALL_SUCCEEDED) {
        return (
          <button className={classNames(className, styles.emailBtnSuccess)}>
            <SocrataIcon name="checkmark3" className={styles.icon} />
            {I18n.home_pane.email_me_success}
          </button>
        );
      } else {
        return (
          <button className={classNames(className, styles.emailBtnError)}>
            {I18n.home_pane.email_me_error}
          </button>
        );
      }
    } else {
      return (
        <button
          className={classNames(className, styles.emailBtnRequest)}
          onClick={() => {
            addEmailInterest(taskSet.job_uuid);
          }}>
          <SocrataIcon name="email" /> {I18n.home_pane.email_me}
        </button>
      );
    }
  } else {
    return null;
  }
}

NotifyButton.propTypes = {
  taskSet: PropTypes.shape({
    job_uuid: PropTypes.string
  }),
  apiCall: PropTypes.shape({
    status: PropTypes.string.isRequired
  }),
  addEmailInterest: PropTypes.func.isRequired,
  className: PropTypes.string
};

function mapStateToProps({ entities, ui }) {
  // _.find returns undefined if it doesn't find anything
  const inProgressTaskSet = _.find(entities.task_sets, (taskSet) => (
    taskSet.status !== ApplyRevision.TASK_SET_SUCCESSFUL
      && taskSet.status !== ApplyRevision.TASK_SET_FAILURE
  ));

  const apiCall = inProgressTaskSet ? _.find(ui.apiCalls, { id: inProgressTaskSet.job_uuid }) : null;

  return {
    taskSet: inProgressTaskSet,
    apiCall
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addEmailInterest: jobUUID => {
      dispatch(ApplyRevision.addEmailInterest(jobUUID));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NotifyButton);
