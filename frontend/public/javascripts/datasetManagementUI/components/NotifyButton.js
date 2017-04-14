import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import * as ApplyUpdate from '../actions/applyUpdate';
import { STATUS_INSERTING, STATUS_SAVED } from '../lib/database/statuses';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/NotifyButton.scss';

function NotifyButton({ email_interests, addEmailInterest, upsertJob }) {
  if (upsertJob) {
    const upsertJobUuid = upsertJob.job_uuid;
    const emailInterest = _.find(email_interests, { job_uuid: upsertJobUuid });
    if (emailInterest) {
      if (emailInterest.__status__.type === STATUS_INSERTING) {
        return (
          <button className={styles.emailBtnBusy}>
            <span className={styles.spinner}></span>
          </button>
        );
      } else if (emailInterest.__status__.type === STATUS_SAVED) {
        return (
          <button className={styles.emailBtnSuccess}>
            <SocrataIcon name="checkmark3" className={styles.icon} />
            {I18n.home_pane.email_me_success}
          </button>
        );
      } else {
        return (
          <button className={styles.emailBtnError}>
            {I18n.home_pane.email_me_error}
          </button>
        );
      }
    } else {
      return (
        <button
          className={styles.emailBtnRequest}
          onClick={() => { addEmailInterest(upsertJobUuid); }}>
          <SocrataIcon name="email" /> {I18n.home_pane.email_me}
        </button>
      );
    }
  } else {
    return null;
  }
}

NotifyButton.propTypes = {
  email_interests: PropTypes.object.isRequired,
  addEmailInterest: PropTypes.func.isRequired,
  upsertJob: PropTypes.object
};

function mapStateToProps(state) {
  const upsertJob = _.find(state.db.upsert_jobs, { status: 'in_progress' }) ||
                    _.find(state.db.upsert_jobs, { status: null });

  return {
    upsertJob,
    email_interests: state.db.email_interests
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addEmailInterest: (jobUuid) => {
      dispatch(ApplyUpdate.addEmailInterest(jobUuid));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NotifyButton);
