import React, { PropTypes } from 'react';
import ProgressBar from '../ProgressBar';
import { commaify } from '../../../common/formatNumber';
import * as ApplyRevision from '../../actions/applyRevision';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/NotificationList/UpsertJobNotification.scss';

export default function UpsertJobNotification({ upsertJob, importTotal, rowsUpserted, percent }) {
  const commaifiedRowsUpserted = commaify(rowsUpserted);
  const commaifiedTotalRows = commaify(importTotal);

  switch (upsertJob.status) {
    case ApplyRevision.UPSERT_JOB_IN_PROGRESS: {
      return (
        <div className={`${styles.notification} ${styles.inProgress}`}>
          <span className={styles.message}>{I18n.progress_items.processing}</span>
          <span className={styles.subMessage}>
            ({commaifiedRowsUpserted} / {commaifiedTotalRows} {I18n.progress_items.rows})
          </span>
          <span className={styles.percentCompleted}>{percent}%</span>
          <div className={styles.progressBarContainer}>
            <ProgressBar percent={percent} type="inProgress" className={styles.progressBar} />
          </div>
        </div>
      );
    }
    case ApplyRevision.UPSERT_JOB_SUCCESSFUL:
      return (
        <div className={`${styles.notification} ${styles.successful}`}>
          <span className={styles.message}>{I18n.progress_items.processing}</span>
          <span className={styles.subMessage}>
            ({commaifiedTotalRows} / {commaifiedTotalRows} {I18n.progress_items.rows})
          </span>
          <span className={styles.successMessage}>
            {I18n.progress_items.success}&nbsp;
            <SocrataIcon name="check" />
          </span>
          <div className={styles.progressBarContainer}>
            <ProgressBar percent={100} type="success" className={styles.progressBar} />
          </div>
        </div>
      );

    case ApplyRevision.UPSERT_JOB_FAILURE:
      return (
        <div className={`${styles.notification} ${styles.error}`}>
          {I18n.progress_items.import_failed}
        </div>
      );

    default:
      console.error('unknown upsert job status', upsertJob.status);
      return null;
  }
}

UpsertJobNotification.propTypes = {
  upsertJob: PropTypes.object.isRequired,
  rowsUpserted: PropTypes.number.isRequired,
  importTotal: PropTypes.number.isRequired,
  percent: PropTypes.number.isRequired
};
