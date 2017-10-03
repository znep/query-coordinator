import _ from 'lodash';
import { browserHistory } from 'react-router';
import uuid from 'uuid';
import { socrataFetch, checkStatus, checkStatusForPoll, getJson } from 'lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  APPLY_REVISION,
  UPDATE_REVISION,
  ADD_EMAIL_INTEREST
} from 'reduxStuff/actions/apiCalls';
import { showModal } from 'reduxStuff/actions/modal';
import { addTaskSet } from 'reduxStuff/actions/taskSets';
import { editRevision } from 'reduxStuff/actions/revisions';
import { getView } from 'reduxStuff/actions/views';
import * as dsmapiLinks from 'links/dsmapiLinks';
import * as Links from 'links/links';
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

// TODO: remove once https://github.com/socrata/dsmapi/pull/402 is deployed
// and we can count on revision.action.permission being there
function shapeRevision(apiResponse) {
  let revision = apiResponse;

  if (revision.action && revision.action.permission) {
    const permission = revision.action.permission;

    revision = {
      ..._.omit(revision, 'action'),
      created_at: parseDate(revision.created_at),
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

export function updateRevision(permission, params) {
  return (dispatch, getState) => {
    const { entities } = getState();
    const { id: revisionId } = _.find(entities.revisions, { revision_seq: _.toNumber(params.revisionSeq) });
    const { permission: oldPermission } = entities.revisions[revisionId];

    if (permission === oldPermission) {
      return;
    }

    // disable btn then reenable in promise resolve
    const callId = uuid();

    dispatch(
      apiCallStarted(callId, {
        operation: UPDATE_REVISION,
        callParams: {
          action: {
            permission
          }
        }
      })
    );

    return socrataFetch(dsmapiLinks.revisionBase(params), {
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

        const updatedRevision = shapeRevision(resp.resource);

        dispatch(editRevision(updatedRevision.id, updatedRevision));
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
      });
  };
}

export function applyRevision(params) {
  return dispatch => {
    const callId = uuid();

    dispatch(
      apiCallStarted(callId, {
        operation: APPLY_REVISION,
        callParams: {}
      })
    );

    return socrataFetch(dsmapiLinks.applyRevision(params), {
      method: 'PUT'
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        dispatch(apiCallSucceeded(callId));
        dispatch(addTaskSet(resp.resource));
        dispatch(showModal('Publishing'));

        const taskSetId = resp.resource.id;

        // maybe return status and then do something based on that?
        dispatch(pollForTaskSetProgress(taskSetId, params));

        browserHistory.push(Links.revisionBase(params));
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
      });
  };
}

const TASK_SET_PROGRESS_POLL_INTERVAL_MS = 1000;

export function pollForTaskSetProgress(taskSetId, params) {
  return dispatch => {
    return socrataFetch(dsmapiLinks.revisionBase(params))
      .then(checkStatusForPoll)
      .then(getJson)
      .then(resp => {
        if (resp) {
          const revision = shapeRevision(resp.resource);

          revision.task_sets.forEach(taskSet => {
            dispatch(pollForTaskSetProgressSuccess(revision, taskSet));
          });

          if (
            _.map(revision.task_sets, 'status').some(
              status => status !== TASK_SET_FAILURE && status !== TASK_SET_SUCCESSFUL
            )
          ) {
            setTimeout(() => {
              dispatch(pollForTaskSetProgress(taskSetId, params));
            }, TASK_SET_PROGRESS_POLL_INTERVAL_MS);
          } else {
            // If the task set is done processing, then go get the view and update
            // it in the store. We mainly care about displaying displayType since
            // that is what we use to determine if we have a published dataset
            dispatch(getView(params.fourfour));
          }
        } else {
          console.warn('Backend service appears to be down presently.');

          setTimeout(() => {
            dispatch(pollForTaskSetProgress(taskSetId, params));
          }, TASK_SET_PROGRESS_POLL_INTERVAL_MS);
        }
      })
      .catch(err => {
        console.error('polling for task set progress failed', err);
      });
  };
}

function pollForTaskSetProgressSuccess(revision, taskSet) {
  const updatedTaskSet = {
    ...taskSet,
    created_at: parseDate(taskSet.created_at),
    updated_at: parseDate(taskSet.updated_at),
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
