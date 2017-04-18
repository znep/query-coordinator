import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { ModalContent, ModalFooter } from 'socrata-components';
import SocrataIcon from '../../../common/components/SocrataIcon';

import ProgressBar from 'components/ProgressBar';
import NotifyButton from 'components/NotifyButton';
import * as ApplyUpdate from 'actions/applyUpdate';
import { hideModal } from 'actions/modal';
import * as Selectors from 'selectors';
import styles from 'styles/Modals/Publishing.scss';

function Publishing({ upsertJob, fourfour, percentUpserted, applyUpdate, hideModal }) {
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
        <button
          key="cancel"
          onClick={hideModal}
          className={styles.cancelButton}>
          {I18n.common.cancel}
        </button>,
        <button
          key="try-again"
          className={styles.tryAgainButton}
          onClick={() => applyUpdate(upsertJob)}>
          {I18n.common.try_again}
        </button>
      ];
  }

  return (
    <div className={styles.publishModal}>
      <h2>{title}</h2>
      <ModalContent>
        <p>{body}</p>
        {icon}
        <div className={styles.progressBarContainer}>
          <ProgressBar percent={percentUpserted} type={status} ariaLabel="progress publishing" />
        </div>
      </ModalContent>
      <ModalFooter className={styles.modalFooter}>
        {button}
      </ModalFooter>
    </div>
  );
}

Publishing.propTypes = {
  upsertJob: PropTypes.shape({
    id: PropTypes.number.isRequired,
    output_schema_id: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired
  }).isRequred,
  fourfour: PropTypes.string.isRequired,
  percentUpserted: PropTypes.number.isRequired,
  applyUpdate: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired
};

function mapStateToProps({ db, routing }) {
  const upsertJob = _.maxBy(_.values(db.upsert_jobs), job => job.updated_at);
  const percentUpserted = Selectors.percentUpserted(db, upsertJob.id);
  const fourfour = routing.fourfour;

  return {
    upsertJob,
    percentUpserted,
    fourfour
  };
}

function mapDispatchToProps(dispatch) {
  return {
    applyUpdate: (upsertJob) => dispatch(ApplyUpdate.applyUpdate(upsertJob.output_schema_id)),
    hideModal: () => dispatch(hideModal())
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Publishing);
