import { socrataFetch, checkStatus, getJson } from '../lib/http';
import { push } from 'react-router-redux';
import {
  insertStarted,
  insertSucceeded,
  insertFailed,
  updateFromServer
} from '../actions/database';
import {
  addNotification,
  removeNotificationAfterTimeout
} from '../actions/notifications';
import { upsertJobNotification } from '../lib/notifications';
import * as dsmapiLinks from '../dsmapiLinks';
import * as Links from '../links';
import { parseDate } from '../lib/parseDate';


export function applyUpdate(outputSchemaId) {
  return (dispatch, getState) => {
    const routing = getState().routing;
    const newUpsertJob = {
      output_schema_id: outputSchemaId
    };
    dispatch(insertStarted('upsert_jobs', newUpsertJob));
    socrataFetch(dsmapiLinks.applyUpdate, {
      method: 'PUT',
      body: JSON.stringify({ output_schema_id: outputSchemaId })
    }).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        dispatch(insertSucceeded('upsert_jobs', newUpsertJob, resp.resource));
        const upsertJobId = resp.resource.id;
        dispatch(addNotification(upsertJobNotification(upsertJobId)));
        dispatch(pollForUpsertJobProgress(upsertJobId));
        dispatch(push(Links.home(routing)));
      }).
      catch((err) => {
        dispatch(insertFailed('upsert_jobs', newUpsertJob, err));
      });
  };
}

const UPSERT_JOB_PROGRESS_POLL_INTERVAL_MS = 1000;

export function pollForUpsertJobProgress(upsertJobId) {
  return (dispatch) => {
    socrataFetch(dsmapiLinks.updateBase).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        const update = resp.resource;
        update.upsert_jobs.forEach((upsertJob) => {
          dispatch(updateFromServer('upsert_jobs', {
            ...upsertJob,
            finished_at: parseDate(upsertJob.finished_at)
          }));
          if (upsertJob.status === 'successful') {
            dispatch(removeNotificationAfterTimeout(upsertJobNotification(upsertJob.id)));
          }
        });
        if (_.map(update.upsert_jobs, 'status').some((status) => status === null)) {
          setTimeout(() => {
            dispatch(pollForUpsertJobProgress(upsertJobId));
          }, UPSERT_JOB_PROGRESS_POLL_INTERVAL_MS);
        }
      }).
      catch((err) => {
        console.log(JSON.stringify(err));
        console.error('polling for upsert job progress failed', err);
      });
  };
}

export function addEmailInterest(upsertJobUuid) {
  return (dispatch) => {
    const newRecord = { job_uuid: upsertJobUuid };
    dispatch(insertStarted('email_interests', newRecord));
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
          dispatch(insertSucceeded('email_interests', newRecord, { id: upsertJobUuid }));
        },
        (err) => {
          dispatch(insertFailed('email_interests', newRecord, err));
        }
      );
  };
}
