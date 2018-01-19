import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import SocrataIcon from '../../../common/components/SocrataIcon';
import { STATUS_CALL_IN_PROGRESS, STATUS_CALL_SUCCEEDED } from 'datasetManagementUI/lib/apiCallStatus';
import styles from './NotifyButton.module.scss';

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

export default NotifyButton;
