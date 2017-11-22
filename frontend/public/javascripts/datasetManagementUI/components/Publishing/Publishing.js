import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { ModalContent, ModalFooter } from 'common/components';
import SocrataIcon from '../../../common/components/SocrataIcon';
import { commaify } from '../../../common/formatNumber';
import ProgressBar from 'components/ProgressBar/ProgressBar';
import NotifyButton from 'containers/NotifyButtonContainer';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import { APPLY_REVISION } from 'reduxStuff/actions/apiCalls';
import styles from './Publishing.scss';

const SubI18n = I18n.home_pane.publish_modal;

// creating columns takes up 10% of the progress bar
const CREATING_COLUMNS_STAGE_FRACTION = 0.1;
const CREATING_COLUMNS_STAGE_TIME_GUESS_MS = 7000;
// hold at this until column creation succeeds
const CREATING_COLUMNS_FRACTION_WHEN_OVER = 0.9;
// actually upserting the data takes 80% of the progress bar
const UPSERTING_STAGE_FRACTION = 0.8;
// everything after reaching 100% data upserted takes up 10% of the progress bar
const FINISHING_STAGE_FRACTION = 0.1;

// TODO(vilterp): remove once DSMAPI reports fine-grained progress again
function temporaryComputeProgress(rowsToBeUpserted, taskSet) {
  if (rowsToBeUpserted === null) {
    return 0.5;
  }
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
      return (
        Math.min(fractionOfTimeEstimate, CREATING_COLUMNS_FRACTION_WHEN_OVER) *
        CREATING_COLUMNS_STAGE_FRACTION
      );
    }
    case ApplyRevision.TASK_SET_UPSERTING: {
      if (rowsToBeUpserted === null) {
        return CREATING_COLUMNS_STAGE_FRACTION + UPSERTING_STAGE_FRACTION;
      }
      const mostRecentLogItem = taskSet.log[0];
      const rowsUpserted = mostRecentLogItem.details.count || 0;
      const fractionUpserted = rowsUpserted / rowsToBeUpserted;
      return CREATING_COLUMNS_STAGE_FRACTION + fractionUpserted * UPSERTING_STAGE_FRACTION;
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
  if (taskSet.status === ApplyRevision.TASK_SET_UPSERTING && rowsToBeUpserted !== null) {
    const upserting = SubI18n.progress_messages.upserting;

    const mostRecentLogItem = taskSet.log[0];
    const upserted = commaify(mostRecentLogItem.details.count || 0);
    const total = commaify(rowsToBeUpserted);
    const rows = I18n.notifications.rows;
    return `${upserting} (${upserted} / ${total} ${rows})`;
  } else {
    return SubI18n.progress_messages[taskSet.status];
  }
}

function getProcessingTitle(revision) {
  if (window.serverConfig.featureFlags.usaid_features_enabled) {
    return revision.is_parent
      ? SubI18n.publishing.data_asset_processing
      : SubI18n.publishing.dataset_processing;
  } else {
    return revision.permission === 'public'
      ? SubI18n.publishing.title_public
      : SubI18n.publishing.title_private;
  }
}

function getSuccessfulMessage(revision) {
  if (window.serverConfig.featureFlags.usaid_features_enabled) {
    return revision.is_parent
      ? SubI18n.successful.data_asset_submitted_title
      : SubI18n.successful.dataset_submitted_title;
  } else {
    return SubI18n.successful.title;
  }
}

const TICK_MS = 500;

class Publishing extends React.Component {
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
    const {
      revision,
      taskSet,
      fourfour,
      rowsToBeUpserted,
      applyRevision,
      onCancelClick,
      params
    } = this.props;

    let title;
    let body;
    let icon;
    let button;
    let message;
    let progressBarType;

    switch (taskSet.status) {
      case ApplyRevision.TASK_SET_SUCCESSFUL:
        title = getSuccessfulMessage(revision);
        body = SubI18n.successful.body;
        progressBarType = 'success';
        message = SubI18n.progress_messages.done;
        icon = <SocrataIcon className={styles.success} name="checkmark-alt" />;
        button = (
          <a href={`/d/${fourfour}`} className={styles.toPrimer}>
            {SubI18n.to_primer}
          </a>
        );
        break;

      case ApplyRevision.TASK_SET_FAILURE:
        title = SubI18n.failure.title;
        body = SubI18n.failure.body;
        progressBarType = 'error';
        message = (<div>
          <span>{SubI18n.failure.include_request_id}</span>
          <pre>
            request_id = {taskSet.request_id}
          </pre>
        </div>);
        icon = <SocrataIcon className={styles.failure} name="close-circle" />;
        button = (
          <div>
            <button key="cancel" onClick={onCancelClick} className={styles.cancelButton}>
              {I18n.common.cancel}
            </button>
            <ApiCallButton
              additionalClassName={styles.tryAgainButton}
              onClick={() => {
                applyRevision(params);
              }}
              operation={APPLY_REVISION}>
              {I18n.common.try_again}
            </ApiCallButton>
          </div>
        );
        break;

      default:
        // in progress
        title = getProcessingTitle(revision);
        body = SubI18n.publishing.body;
        progressBarType = 'inProgress';
        message = inProgressMessage(rowsToBeUpserted, taskSet);
        icon = <SocrataIcon className={styles.inProgress} name="public-open" />;
        button = <NotifyButton className={styles.button} />;
        break;
    }

    return (
      <div>
        <h2>
          {title}
        </h2>
        <ModalContent>
          <p>
            {body}
          </p>
          {icon}
          <div className={styles.progressBarContainer}>
            <ProgressBar
              percent={computeProgress(rowsToBeUpserted, taskSet) * 100}
              type={progressBarType}
              ariaLabel="progress publishing" />
          </div>
          <div className={styles.statusMessage}>
            {message}
          </div>
        </ModalContent>
        <ModalFooter className={styles.modalFooter}>
          {button}
        </ModalFooter>
      </div>
    );
  }
}

Publishing.propTypes = {
  revision: PropTypes.shape({
    permission: PropTypes.string.isRequired
  }).isRequired,
  taskSet: PropTypes.shape({
    status: PropTypes.oneOf(ApplyRevision.TASK_SET_STATUSES),
    created_at: PropTypes.instanceOf(Date)
  }).isRequired,
  rowsToBeUpserted: PropTypes.number,
  fourfour: PropTypes.string.isRequired,
  applyRevision: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired
};

export default Publishing;
