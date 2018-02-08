import uuid from 'uuid';
import { parseDate } from 'datasetManagementUI/lib/parseDate';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  UPDATE_REVISION
} from 'datasetManagementUI/reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'datasetManagementUI/links/dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'datasetManagementUI/lib/http';

export const EDIT_REVISION = 'EDIT_REVISION';
export const SET_REVISION_VALUE = 'SET_REVISION_VALUE';
export const editRevision = (id, payload) => ({
  type: EDIT_REVISION,
  id,
  payload
});

export const setRevisionValue = (path, value) => ({
  type: SET_REVISION_VALUE,
  path,
  value
});

export function shapeRevision(apiResponse) {
  let revision = apiResponse;

  revision = {
    ...revision,
    created_at: parseDate(revision.created_at)
  };

  return revision;
}

export function updateRevision(update, params, callId = uuid()) {
  return dispatch => {
    dispatch(
      apiCallStarted(callId, {
        operation: UPDATE_REVISION,
        callParams: {
          ...update
        }
      })
    );

    return socrataFetch(dsmapiLinks.revisionBase(params), {
      method: 'PUT',
      body: JSON.stringify(update)
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        dispatch(apiCallSucceeded(callId));
        return resp;
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
        throw err;
      });
  };
}
