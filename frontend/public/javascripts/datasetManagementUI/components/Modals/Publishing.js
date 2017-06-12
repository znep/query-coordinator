import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { ModalContent, ModalFooter } from 'common/components';
import SocrataIcon from '../../../common/components/SocrataIcon';

import ProgressBar from 'components/ProgressBar';
import NotifyButton from 'components/NotifyButton';
import * as ApplyRevision from 'actions/applyRevision';
import { hideModal } from 'actions/modal';
import ApiCallButton from 'components/ApiCallButton';
import { APPLY_REVISION } from 'actions/apiCalls';
import * as Selectors from 'selectors';
import styles from 'styles/Modals/Publishing.scss';

function Publishing({ taskSet, fourfour, percentUpserted, applyRevision, onCancelClick }) {
  let title;
  let body;
  let status;
  let icon;
  let button;

  switch (taskSet.status) {
    case ApplyRevision.TASK_SET_IN_PROGRESS:
      title = I18n.home_pane.publish_modal.publishing.title;
      body = I18n.home_pane.publish_modal.publishing.body;
      status = 'inProgress';
      icon = <SocrataIcon className={styles.inProgress} name="public-open" />;
      button = <NotifyButton className={styles.button} />;
      break;

    case ApplyRevision.TASK_SET_SUCCESSFUL:
      title = I18n.home_pane.publish_modal.successful.title;
      body = I18n.home_pane.publish_modal.successful.body;
      status = 'success';
      icon = <SocrataIcon className={styles.success} name="checkmark-alt" />;
      button = (
        <a href={`/d/${fourfour}`} className={styles.toPrimer}>
          {I18n.home_pane.publish_modal.to_primer}
        </a>
      );
      break;

    default:
      title = I18n.home_pane.publish_modal.failure.title;
      body = I18n.home_pane.publish_modal.failure.body;
      status = 'error';
      icon = <SocrataIcon className={styles.failure} name="close-circle" />;
      button = (
        <div>
          <button key="cancel" onClick={onCancelClick} className={styles.cancelButton}>
            {I18n.common.cancel}
          </button>
          <ApiCallButton
            additionalClassName={styles.tryAgainButton}
            onClick={() => {
              applyRevision(taskSet);
            }}
            operation={APPLY_REVISION}>
            {I18n.common.try_again}
          </ApiCallButton>
        </div>
      );
  }

  return (
    <div>
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
  taskSet: PropTypes.shape({
    id: PropTypes.number.isRequired,
    output_schema_id: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired
  }).isRequired,
  fourfour: PropTypes.string.isRequired,
  percentUpserted: PropTypes.number.isRequired,
  applyRevision: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired
};

function mapStateToProps({ entities, ui }) {
  const taskSet = _.maxBy(_.values(entities.task_sets), job => job.updated_at);
  const percentUpserted = Selectors.percentUpserted(entities, taskSet.id);
  const { fourfour } = ui.routing;

  return {
    taskSet,
    percentUpserted,
    fourfour
  };
}

function mapDispatchToProps(dispatch) {
  return {
    applyRevision: taskSet => dispatch(ApplyRevision.applyRevision(taskSet.output_schema_id)),
    onCancelClick: () => dispatch(hideModal())
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Publishing);
