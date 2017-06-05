import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import SocrataIcon from '../../common/components/SocrataIcon';
import * as ApplyRevision from 'actions/applyRevision';
import { STATUS_INSERTING, STATUS_SAVED } from 'lib/database/statuses';
import styles from 'styles/NotifyButton.scss';

function NotifyButton({ email_interests, addEmailInterest, upsertJob, className }) {
  if (upsertJob) {
    const upsertJobUuid = upsertJob.job_uuid;
    const emailInterest = _.find(email_interests, { job_uuid: upsertJobUuid });

    if (emailInterest) {
      if (emailInterest.__status__.type === STATUS_INSERTING) {
        return (
          <button className={classNames(className, styles.emailBtnBusy)}>
            <span className={styles.spinner}></span>
          </button>
        );
      } else if (emailInterest.__status__.type === STATUS_SAVED) {
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
  upsertJob: PropTypes.shape({
    job_uuid: PropTypes.string
  }),
  className: PropTypes.string
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
      dispatch(ApplyRevision.addEmailInterest(jobUuid));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NotifyButton);
