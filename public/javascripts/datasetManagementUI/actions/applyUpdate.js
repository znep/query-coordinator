import { socrataFetch, checkStatus, getJson } from '../lib/http';
import { push } from 'react-router-redux';
import {
  insertStarted,
  insertSucceeded,
  insertFailed,
  updateFromServer
} from '../actions/database';
import * as dsmapiLinks from '../dsmapiLinks';
import * as Links from '../links';

export function applyUpdate(outputSchemaId) {
  return (dispatch, getState) => {
    const routing = getState().routing;
    const newUpsertJob = {
      schema_id: outputSchemaId
    };
    dispatch(insertStarted('upsert_jobs', newUpsertJob));
    socrataFetch(dsmapiLinks.applyUpdate(routing), {
      method: 'PUT',
      body: JSON.stringify({ schemas: outputSchemaId }) // TODO: change this to `schema` in DSMAPI
    }).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        const upsertJobId = resp.upsert_job;
        dispatch(insertSucceeded('upsert_jobs', newUpsertJob, { id: upsertJobId }));
        dispatch(pollForUpsertJobProgress(upsertJobId));
        dispatch(push(Links.showUpsertJob(upsertJobId)(routing)));
      }).
      catch((err) => {
        dispatch(insertFailed('upsert_jobs', newUpsertJob, err));
      });
  };
}

const UPSERT_JOB_PROGRESS_POLL_INTERVAL_MS = 1000;

export function pollForUpsertJobProgress(upsertJobId) {
  return (dispatch, getState) => {
    const routing = getState().routing;
    console.log('polling for upsert job progress for job', upsertJobId);
    socrataFetch(dsmapiLinks.updateBase(routing)).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        const update = resp.resource;
        update.upsert_jobs.forEach((upsertJob) => {
          dispatch(updateFromServer('upsert_jobs', upsertJob));
        });
        if (_.map(update.upsert_jobs, 'status').some((status) => status === null)) {
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
