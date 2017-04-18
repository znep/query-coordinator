import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { Modal, ModalContent } from 'socrata-components';
import SocrataIcon from '../../common/components/SocrataIcon';

import ProgressBar from './ProgressBar';
import NotifyButton from './NotifyButton';
import * as ApplyUpdate from '../actions/applyUpdate.js';
import * as Selectors from '../selectors.js';
import styles from 'styles/PublishingModal.scss';

function PublishingModal({ upsertJob, fourfour, percentUpserted, applyUpdate }) {
  if (!upsertJob) {
    return null;
  }

  let title;
  let body;
  let status;
  let icon;
  let button;

  switch (upsertJob.status) {
    case ApplyUpdate.UPSERT_JOB_IN_PROGRESS:
      title = I18n.home_pane.publish_modal.publishing.title;
      body = I18n.home_pane.publish_modal.publishing.body;
      status = 'inProgress';
      icon = <SocrataIcon className={styles.inProgress} name="public-open" />;
      button = <NotifyButton className={styles.button} />;

      break;
    case ApplyUpdate.UPSERT_JOB_SUCCESSFUL:
      title = I18n.home_pane.publish_modal.successful.title;
      body = I18n.home_pane.publish_modal.successful.body;
      status = 'success';
      icon = <SocrataIcon className={styles.success} name="checkmark-alt" />;
      button = (
        <a
          href={`/d/${fourfour}`}
          className={styles.toPrimer}>
          {I18n.home_pane.publish_modal.to_primer}
        </a>
      );

      break;
    default:
      title = I18n.home_pane.publish_modal.failure.title;
      body = I18n.home_pane.publish_modal.failure.body;
      status = 'error';
      icon = <SocrataIcon className={styles.failure} name="close-circle" />;
      button = [
        <a
          key="cancel"
          href="/profile"
          className={styles.cancelButton}>
          {I18n.common.cancel}
        </a>,
        <button
          key="try-again"
          className={styles.tryAgainButton}
          onClick={() => applyUpdate(upsertJob)}>
          {I18n.common.try_again}
        </button>
      ];
  }

  return (
    <Modal className={styles.publishModal} onDismiss={_.noop} >
      <h2>{title}</h2>
      <ModalContent>
        <p>{body}</p>
        {icon}
        <div className={styles.progressBarContainer}>
          <ProgressBar percent={percentUpserted} type={status} ariaLabel="progress publishing" />
        </div>
        {button}
      </ModalContent>
    </Modal>
  );
}

PublishingModal.propTypes = {
  upsertJob: PropTypes.shape({
    id: PropTypes.number,
    output_schema_id: PropTypes.number,
    status: PropTypes.string
  }),
  fourfour: PropTypes.string,
  percentUpserted: PropTypes.number,
  applyUpdate: PropTypes.func
};

function mapStateToProps(state) {
  const upsertJob = _.maxBy(_.values(state.db.upsert_jobs), job => job.updated_at);

  if (upsertJob) {
    const percentUpserted = Selectors.percentUpserted(state.db, upsertJob.id);
    const fourfour = state.routing.fourfour;

    return {
      upsertJob,
      percentUpserted,
      fourfour
    };
  } else {
    return {};
  }
}

function mapDispatchToProps(dispatch) {
  return {
    applyUpdate: (upsertJob) => dispatch(ApplyUpdate.applyUpdate(upsertJob.output_schema_id))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PublishingModal);
