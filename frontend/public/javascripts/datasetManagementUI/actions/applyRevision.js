import _ from 'lodash';
import { push } from 'react-router-redux';
import uuid from 'uuid';
import { socrataFetch, checkStatus, checkStatusForPoll, getJson } from 'lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  APPLY_REVISION,
  ADD_EMAIL_INTEREST
} from 'actions/apiCalls';
import { showModal } from 'actions/modal';
import { addTaskSet } from 'actions/taskSets';
import * as dsmapiLinks from 'dsmapiLinks';
import * as Links from 'links';
import * as Selectors from 'selectors';
import { parseDate } from 'lib/parseDate';

// match DSMAPI: https://github.com/socrata/dsmapi/blob/e4eb96e24e0734b33d5ab6ffb26351a07b1c61d1/web/models/task_set.ex#L30-L35
export const TASK_SET_INITIALIZING = 'initializing';
export const TASK_SET_CREATING_COLUMNS = 'creating_columns';
export const TASK_SET_UPSERTING = 'upserting';
export const TASK_SET_FINISHING = 'finishing';
// all of the above are sub-states of 'in_progress'; eventually DSMAPI will just send them
// instead of in_progress
export const TASK_SET_IN_PROGRESS = 'in_progress';
export const TASK_SET_SUCCESSFUL = 'successful';
export const TASK_SET_FAILURE = 'failure';

// this is the only thing we look at from the log
export const TASK_SET_STAGE_ROWS_UPSERTED = 'rows_upserted';

export const TASK_SET_STATUSES = [
  TASK_SET_INITIALIZING,
  TASK_SET_CREATING_COLUMNS,
  TASK_SET_UPSERTING,
  TASK_SET_FINISHING,
  TASK_SET_IN_PROGRESS,
  TASK_SET_SUCCESSFUL,
  TASK_SET_FAILURE
];

export const POLL_FOR_TASK_SET_PROGRESS_SUCCESS = 'POLL_FOR_TASK_SET_PROGRESS_SUCCESS';

export function applyRevision() {
  return (dispatch, getState) => {
    const { location } = getState().ui.routing;
    const outputSchemaId = Selectors.latestOutputSchema(getState().entities).id;
    const callId = uuid();

    dispatch(
      apiCallStarted(callId, {
        operation: APPLY_REVISION,
        params: { outputSchemaId }
      })
    );

    return socrataFetch(dsmapiLinks.applyRevision, {
      method: 'PUT',
      body: JSON.stringify({ output_schema_id: outputSchemaId })
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        dispatch(apiCallSucceeded(callId));
        dispatch(addTaskSet(resp.resource));
        dispatch(showModal('Publishing'));

        const taskSetId = resp.resource.id;

        // maybe return status and then do something based on that?
        dispatch(pollForTaskSetProgress(taskSetId));

        dispatch(push(Links.home(location)));
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
      });
  };
}

const TASK_SET_PROGRESS_POLL_INTERVAL_MS = 1000;

export function pollForTaskSetProgress(taskSetId) {
  return dispatch => {
    return socrataFetch(dsmapiLinks.revisionBase)
      .then(checkStatusForPoll)
      .then(getJson)
      .then(resp => {
        if (resp) {
          const revision = resp.resource;

          revision.task_sets.forEach(taskSet => {
            dispatch(pollForTaskSetProgressSuccess(revision, taskSet));
          });

          if (_.map(revision.task_sets, 'status').some(status => (
              status !== TASK_SET_FAILURE && status !== TASK_SET_SUCCESSFUL))) {
            setTimeout(() => {
              dispatch(pollForTaskSetProgress(taskSetId));
            }, TASK_SET_PROGRESS_POLL_INTERVAL_MS);
          }
        } else {
          console.warn('Backend service appears to be down presently.');

          setTimeout(() => {
            dispatch(pollForTaskSetProgress(taskSetId));
          }, TASK_SET_PROGRESS_POLL_INTERVAL_MS);
        }
      })
      .catch(err => {
        console.error('polling for upsert job progress failed', err);
      });
  };
}

function pollForTaskSetProgressSuccess(revision, taskSet) {
  const updatedTaskSet = {
    ...taskSet,
    created_at: parseDate(taskSet.created_at),
    finished_at: taskSet.finished_at ? parseDate(taskSet.finished_at) : null
  };
  const updateRevision = {
    ...revision,
    task_sets: revision.task_sets.map(ts => ts.id)
  };

  return {
    type: POLL_FOR_TASK_SET_PROGRESS_SUCCESS,
    taskSet: updatedTaskSet,
    revision: updateRevision
  };
}

export function addEmailInterest(jobUUID) {
  return dispatch => {
    dispatch(
      apiCallStarted(jobUUID, {
        operation: ADD_EMAIL_INTEREST
      })
    );

    return socrataFetch(`/users/${serverConfig.currentUserId}/email_interests.json`, {
      method: 'POST',
      body: JSON.stringify({
        eventTag: 'MAIL.IMPORT_ACTIVITY_COMPLETE',
        extraInfo: jobUUID
      })
    })
      .then(checkStatus)
      .then(() => dispatch(apiCallSucceeded(jobUUID)))
      .catch(err => dispatch(apiCallFailed(jobUUID, err)));
  };
}
