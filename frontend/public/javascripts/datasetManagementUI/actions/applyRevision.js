import _ from 'lodash';
import { push } from 'react-router-redux';
import uuid from 'uuid';
import { socrataFetch, checkStatus, checkStatusForPoll, getJson } from 'lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  APPLY_REVISION,
  UPDATE_REVISION,
  ADD_EMAIL_INTEREST
} from 'actions/apiCalls';
import { showModal } from 'actions/modal';
import { addTaskSet } from 'actions/taskSets';
import { editRevision } from 'actions/revisions';
import * as dsmapiLinks from 'dsmapiLinks';
import * as Links from 'links';
import * as Selectors from 'selectors';
import { parseDate } from 'lib/parseDate';

// from https://github.com/socrata/dsmapi/blob/0071c4cdf5128698e6ae9ad2ed1c307e884bb386/web/models/upsert_job.ex#L32-L34
// TODO: put these in some kind of model class?
export const TASK_SET_IN_PROGRESS = 'in_progress';
export const TASK_SET_SUCCESSFUL = 'successful';
export const TASK_SET_FAILURE = 'failure';
export const POLL_FOR_TASK_SET_PROGRESS_SUCCESS = 'POLL_FOR_TASK_SET_PROGRESS_SUCCESS';

// TODO: remove once https://github.com/socrata/dsmapi/pull/402 is deployed
// and we can count on revision.action.permission being there
function shapeRevision(apiResponse) {
  let revision = apiResponse;

  if (revision.action && revision.action.permission) {
    const permission = revision.action.permission;

    revision = {
      ..._.omit(revision, 'action'),
      permission
    };
  } else {
    revision = {
      ...revision,
      permission: 'public'
    };
  }

  return revision;
}

export function updateRevision(permission) {
  return (dispatch, getState) => {
    const { entities } = getState();
    const { id: revisionId } = Selectors.latestRevision(entities);
    const { permission: oldPermission } = entities.revisions[revisionId];

    if (permission === oldPermission) {
      return;
    }

    // disable btn then reenable in promise resolve
    const callId = uuid();

    dispatch(
      apiCallStarted(callId, {
        operation: UPDATE_REVISION,
        params: {
          action: {
            permission
          }
        }
      })
    );

    return socrataFetch(dsmapiLinks.revisionBase, {
      method: 'PUT',
      body: JSON.stringify({
        action: {
          permission
        }
      })
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        dispatch(apiCallSucceeded(callId));

        const revision = shapeRevision(resp.resource);

        dispatch(editRevision(revision.id, revision));
      })
      .catch(err => {
        console.log(err);
        dispatch(apiCallFailed(callId, err));
      });
  };
}

export function applyRevision() {
  return (dispatch, getState) => {
    const { entities, ui } = getState();
    const { location } = ui.routing;
    const { id: outputSchemaId } = Selectors.latestOutputSchema(entities);

    const callId = uuid();

    dispatch(
      apiCallStarted(callId, {
        operation: APPLY_REVISION,
        params: {
          outputSchemaId
        }
      })
    );

    return socrataFetch(dsmapiLinks.applyRevision, {
      method: 'PUT',
      body: JSON.stringify({
        output_schema_id: outputSchemaId
      })
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
          const revision = shapeRevision(resp.resource);

          revision.task_sets.forEach(taskSet => {
            dispatch(pollForTaskSetProgressSuccess(revision, taskSet));
          });

          if (_.map(revision.task_sets, 'status').some(status => status === TASK_SET_IN_PROGRESS)) {
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
    finished_at: taskSet.finished_at ? parseDate(taskSet.finished_at) : null
  };

  const updatedRevision = {
    ...revision,
    task_sets: revision.task_sets.map(ts => ts.id)
  };

  return {
    type: POLL_FOR_TASK_SET_PROGRESS_SUCCESS,
    taskSet: updatedTaskSet,
    revision: updatedRevision
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
