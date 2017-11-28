import uuid from 'uuid';
import _ from 'lodash';
import { parseDate } from 'lib/parseDate';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  UPDATE_REVISION
} from 'reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'links/dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';

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

// TODO: remove once https://github.com/socrata/dsmapi/pull/402 is deployed
// and we can count on revision.action.permission being there
export function shapeRevision(apiResponse) {
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
