import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { ModalContent, ModalFooter } from 'common/components';
import SocrataIcon from '../../../common/components/SocrataIcon';
import { commaify } from '../../../common/formatNumber';

import ProgressBar from 'components/ProgressBar';
import NotifyButton from 'components/NotifyButton';
import * as ApplyRevision from 'actions/applyRevision';
import { hideModal } from 'actions/modal';
import ApiCallButton from 'components/ApiCallButton';
import { APPLY_REVISION } from 'actions/apiCalls';
import * as Selectors from 'selectors';
import styles from 'styles/Modals/Publishing.scss';

const SubI18n = I18n.home_pane.publish_modal;

// creating columns takes up 10% of the progress bar
const CREATING_COLUMNS_STAGE_FRACTION = 0.1;
const CREATING_COLUMNS_STAGE_TIME_GUESS_MS = 7000;
const CREATING_COLUMNS_FRACTION_WHEN_OVER = 0.9; // hold at this until column creation succeeds
// actually upserting the data takes 80% of the progress bar
const UPSERTING_STAGE_FRACTION = 0.8;
// everything after reaching 100% data upserted takes up 10% of the progress bar
const FINISHING_STAGE_FRACTION = 0.1;

// TODO(vilterp): remove once DSMAPI reports fine-grained progress again
function temporaryComputeProgress(rowsToBeUpserted, taskSet) {
  const mostRecentRowsUpsertedItem = _.find(taskSet.log || [], {
    stage: ApplyRevision.TASK_SET_STAGE_ROWS_UPSERTED
  });
  if (mostRecentRowsUpsertedItem) {
    const rowsUpserted = mostRecentRowsUpsertedItem.details.count;
    return rowsUpserted / rowsToBeUpserted;
  } else {
    return 0;
  }
}

export function computeProgress(rowsToBeUpserted, taskSet) {
  if (taskSet.status === ApplyRevision.TASK_SET_IN_PROGRESS) {
    return temporaryComputeProgress(rowsToBeUpserted, taskSet);
  }
  const now = new Date();
  switch (taskSet.status) {
    case ApplyRevision.TASK_SET_INITIALIZING:
    case ApplyRevision.TASK_SET_CREATING_COLUMNS: {
      const fractionOfTimeEstimate = (now - taskSet.created_at) / CREATING_COLUMNS_STAGE_TIME_GUESS_MS;
      return Math.min(
        fractionOfTimeEstimate,
        CREATING_COLUMNS_FRACTION_WHEN_OVER
      ) * CREATING_COLUMNS_STAGE_FRACTION;
    }
    case ApplyRevision.TASK_SET_UPSERTING: {
      const mostRecentLogItem = taskSet.log[0];
      const rowsUpserted = mostRecentLogItem.details.count || 0;
      const fractionUpserted = rowsUpserted / rowsToBeUpserted;
      return CREATING_COLUMNS_STAGE_FRACTION + (fractionUpserted * UPSERTING_STAGE_FRACTION);
    }
    case ApplyRevision.TASK_SET_SUCCESSFUL:
      return 1;

    case ApplyRevision.TASK_SET_FAILURE:
      return 1;
    default:
      return CREATING_COLUMNS_STAGE_FRACTION + UPSERTING_STAGE_FRACTION + FINISHING_STAGE_FRACTION / 2;
  }
}

function inProgressMessage(rowsToBeUpserted, taskSet) {
  switch (taskSet.status) {
    case ApplyRevision.TASK_SET_UPSERTING: {
      const upserting = SubI18n.progress_messages.upserting;

      const mostRecentLogItem = taskSet.log[0];
      const upserted = commaify(mostRecentLogItem.details.count || 0);
      const total = commaify(rowsToBeUpserted);
      const rows = I18n.progress_items.rows;
      return `${upserting} (${upserted} / ${total} ${rows})`;
    }
    default:
      return SubI18n.progress_messages[taskSet.status];
  }
}

const TICK_MS = 500;

export class Publishing extends React.Component {

  constructor() {
    super();
    this.state = {
      ticks: 0, // thing we change so it'll rerender
      tickerIntervalID: setInterval(() => {
        this.setState({
          ticks: this.state.ticks + 1
        });
      }, TICK_MS)
    };
  }

  componentWillUnmount() {
    clearInterval(this.state.tickerIntervalID);
  }

  render() {
    const { taskSet, fourfour, rowsToBeUpserted, applyRevision, onCancelClick } = this.props;

    let title;
    let body;
    let icon;
    let button;
    let message;
    let progressBarType;

    switch (taskSet.status) {
      case ApplyRevision.TASK_SET_SUCCESSFUL:
        title = SubI18n.successful.title;
        body = SubI18n.successful.body;
        progressBarType = 'success';
        message = SubI18n.progress_messages.done;
        icon = <SocrataIcon className={styles.success} name="checkmark-alt" />;
        button = (
          <a
            href={`/d/${fourfour}`}
            className={styles.toPrimer}>
            {SubI18n.to_primer}
          </a>
        );
        break;

      case ApplyRevision.TASK_SET_FAILURE:
        title = SubI18n.failure.title;
        body = SubI18n.failure.body;
        progressBarType = 'error';
        message = null;
        icon = <SocrataIcon className={styles.failure} name="close-circle" />;
        button = (
          <div>
            <button
              key="cancel"
              onClick={onCancelClick}
              className={styles.cancelButton}>
              {I18n.common.cancel}
            </button>
            <ApiCallButton
              additionalClassName={styles.tryAgainButton}
              onClick={() => { applyRevision(taskSet); }}
              operation={APPLY_REVISION}>
              {I18n.common.try_again}
            </ApiCallButton>
          </div>
        );
        break;

      default:
        // in progress
        title = SubI18n.publishing.title;
        body = SubI18n.publishing.body;
        progressBarType = 'inProgress';
        message = inProgressMessage(rowsToBeUpserted, taskSet);
        icon = <SocrataIcon className={styles.inProgress} name="public-open" />;
        button = <NotifyButton className={styles.button} />;
        break;
    }

    return (
      <div>
        <h2>{title}</h2>
        <ModalContent>
          <p>{body}</p>
          {icon}
          <div className={styles.progressBarContainer}>
            <ProgressBar
              percent={computeProgress(rowsToBeUpserted, taskSet) * 100}
              type={progressBarType}
              ariaLabel="progress publishing" />
          </div>
          {taskSet.status !== ApplyRevision.TASK_SET_FAILURE &&
            <div className={styles.statusMessage}>
              {message}
            </div>}
        </ModalContent>
        <ModalFooter className={styles.modalFooter}>
          {button}
        </ModalFooter>
      </div>
    );
  }

}

Publishing.propTypes = {
  taskSet: PropTypes.shape({
    status: PropTypes.oneOf(ApplyRevision.TASK_SET_STATUSES),
    created_at: PropTypes.instanceOf(Date)
  }).isRequired,
  rowsToBeUpserted: PropTypes.number.isRequired,
  fourfour: PropTypes.string.isRequired,
  applyRevision: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired
};

export function mapStateToProps({ entities, ui: { routing } }) {
  const taskSet = _.maxBy(_.values(entities.task_sets), job => job.updated_at);
  const fourfour = routing.fourfour;
  const rowsToBeUpserted = Selectors.rowsToBeImported(entities, taskSet.output_schema_id);

  return {
    taskSet,
    fourfour,
    rowsToBeUpserted
  };
}

function mapDispatchToProps(dispatch) {
  return {
    applyRevision: taskSet => dispatch(ApplyRevision.applyRevision(taskSet.output_schema_id)),
    onCancelClick: () => dispatch(hideModal())
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Publishing);
