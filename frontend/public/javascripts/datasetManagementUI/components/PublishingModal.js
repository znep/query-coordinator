import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { Modal, ModalContent, ModalFooter } from 'socrata-components';
import SocrataIcon from '../../common/components/SocrataIcon';

import ProgressBar from './ProgressBar';
import NotifyButton from './NotifyButton';
import * as ApplyUpdate from '../actions/applyUpdate.js';
import * as Selectors from '../selectors.js';
import styles from 'styles/PublishingModal.scss';

function PublishingModal({ upsertJob, fourfour, percentUpserted }) {
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
      icon = { name: 'geo', className: styles.inProgress };
      button = <NotifyButton className={styles.button} />;

      break;
    case ApplyUpdate.UPSERT_JOB_SUCCESSFUL:
      title = I18n.home_pane.publish_modal.successful.title;
      body = I18n.home_pane.publish_modal.successful.body;
      status = 'success';
      icon = { name: 'checkmark-alt', className: styles.success };
      button = (
        <a
          href={`/d/${fourfour}`}
          className={classNames('btn', 'btn-primary', styles.button)}>
          {I18n.home_pane.publish_modal.to_primer}
        </a>
      );

      break;
    default:
      return null;
  }

  return (
    <Modal className={styles.publishModal} onDismiss={_.noop} >
      <h2>{title}</h2>
      <ModalContent>
        <p>{body}</p>
        <SocrataIcon className={classNames(styles.statusIcon, icon.className)} name={icon.name} />
        <div className={styles.progressBarContainer}>
          <ProgressBar percent={percentUpserted} type={status} ariaLabel="progress publishing" />
        </div>
        {button}
      </ModalContent>
      <ModalFooter />
    </Modal>
  );
}

PublishingModal.propTypes = {
  upsertJob: PropTypes.shape({
    id: PropTypes.number,
    status: PropTypes.string
  }),
  fourfour: PropTypes.string,
  percentUpserted: PropTypes.number
};

function mapStateToProps(state) {
  const upsertJob = _.maxBy(_.values(state.db.upsert_jobs), job => job.updated_at);

  if (upsertJob) {
    let percentUpserted = Selectors.percentUpserted(state.db, upsertJob.id);
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

export default connect(mapStateToProps)(PublishingModal);
