import { socrataFetch, checkStatus, checkStatusForPoll, getJson } from '../lib/http';
import { push } from 'react-router-redux';
import {
  upsertStarted,
  upsertSucceeded,
  upsertFailed,
  updateFromServer
} from '../actions/database';
import { showModal } from 'actions/modal';
import * as dsmapiLinks from '../dsmapiLinks';
import * as Links from '../links';
import * as Selectors from '../selectors';
import { parseDate } from '../lib/parseDate';

// from https://github.com/socrata/dsmapi/blob/0071c4cdf5128698e6ae9ad2ed1c307e884bb386/web/models/upsert_job.ex#L32-L34
// TODO: put these in some kind of model class?
export const UPSERT_JOB_IN_PROGRESS = 'in_progress';
export const UPSERT_JOB_SUCCESSFUL = 'successful';
export const UPSERT_JOB_FAILURE = 'failure';

export function applyUpdate() {
  return (dispatch, getState) => {
    const routing = getState().routing.location;
    const outputSchemaId = Selectors.latestOutputSchema(getState().db).id;
    const newUpsertJob = {
      output_schema_id: outputSchemaId
    };
    dispatch(upsertStarted('upsert_jobs', newUpsertJob));
    socrataFetch(dsmapiLinks.applyUpdate, {
      method: 'PUT',
      body: JSON.stringify({ output_schema_id: outputSchemaId })
    }).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        dispatch(upsertSucceeded('upsert_jobs', newUpsertJob, resp.resource));
        dispatch(showModal('Publishing'));
        const upsertJobId = resp.resource.id;
        dispatch(pollForUpsertJobProgress(upsertJobId));
        dispatch(push(Links.home(routing)));
      }).
      catch((err) => {
        dispatch(upsertFailed('upsert_jobs', newUpsertJob, err));
      });
  };
}

const UPSERT_JOB_PROGRESS_POLL_INTERVAL_MS = 1000;

export function pollForUpsertJobProgress(upsertJobId) {
  return (dispatch) => {
    socrataFetch(dsmapiLinks.revisionBase).
      then(checkStatusForPoll).
      then(getJson).
      then(resp => {
        if (resp) {
          const update = resp.resource;
          update.upsert_jobs.forEach((upsertJob) => {
            dispatch(updateFromServer('upsert_jobs', {
              ...upsertJob,
              finished_at: parseDate(upsertJob.finished_at)
            }));
          });
          if (_.map(update.upsert_jobs, 'status').some((status) => status === UPSERT_JOB_IN_PROGRESS)) {
            setTimeout(() => {
              dispatch(pollForUpsertJobProgress(upsertJobId));
            }, UPSERT_JOB_PROGRESS_POLL_INTERVAL_MS);
          }
        } else {
          console.warn('Backend service appears to be down presently.');

          setTimeout(() => {
            dispatch(pollForUpsertJobProgress(upsertJobId));
          }, UPSERT_JOB_PROGRESS_POLL_INTERVAL_MS);
        }
      }).
      catch((err) => {
        console.error('polling for upsert job progress failed', err);
      });
  };
}

export function addEmailInterest(upsertJobUuid) {
  return (dispatch) => {
    const newRecord = { job_uuid: upsertJobUuid };
    dispatch(upsertStarted('email_interests', newRecord));
    socrataFetch(`/users/${serverConfig.currentUserId}/email_interests.json`, {
      method: 'POST',
      body: JSON.stringify({
        eventTag: 'MAIL.IMPORT_ACTIVITY_COMPLETE',
        extraInfo: upsertJobUuid
      })
    }).
      then(checkStatus).
      then(
        () => {
          dispatch(upsertSucceeded('email_interests', newRecord, { id: upsertJobUuid }));
        },
        (err) => {
          dispatch(upsertFailed('email_interests', newRecord, err));
        }
      );
  };
}
