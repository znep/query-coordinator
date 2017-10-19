import uuid from 'uuid';
// import _ from 'lodash';
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

export function updateRevision(update, params) {
  return dispatch => {
    const callId = uuid();

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
